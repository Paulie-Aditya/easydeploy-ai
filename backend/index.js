/**
 * EasyDeploy AI - backend
 * - /generate-token -> uses Gemini to return JSON token config
 * - /upload-logo -> accepts base64 or SVG, stores on nft.storage, returns IPFS URL
 * - /1inch/quote -> proxy to 1inch quote endpoint (mainnet / polygon)
 * - /ens/resolve -> resolve ENS name for an address (uses Alchemy provider)
 * - /pyth/price -> simple Hermes pull (if configured), fallback to CoinGecko
 *
 * Run:
 * cd backend
 * npm install
 * node index.js
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai'); // Gemini SDK
const { NFTStorage, File } = require('nft.storage'); // will try to integrate dall-e here
const axios = require('axios');
const { ethers } = require('ethers');
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

const PORT = process.env.PORT || 5001;

// Gemini client (text)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// NFT.Storage client
const nftClient = new NFTStorage({ token: process.env.NFT_STORAGE_KEY });

//1inch helper
const ONEINCH_BASE = 'https://api.1inch.io/v5.0'; // e.g. /137/quote

// Sepolia provider used for ENS writes
const SEP_RPC = process.env.SEPOLIA_RPC_URL;
if(!SEP_RPC) console.warn('Warning: SEPOLIA_RPC_URL not set. ENS write will fail if not configured.');

const ENS_OWNER_PK = process.env.ENS_OWNER_PRIVATE_KEY || '';
if(!ENS_OWNER_PK) console.warn('Warning: ENS_OWNER_PRIVATE_KEY not set. subdomain create requires owner key.');


// web3 set up for ENS write actions (HDWalletProvider)
let web3ForEns;
let ensAccount;
if (SEP_RPC && ENS_OWNER_PK) {
  const provider = new HDWalletProvider({ privateKeys: [ENS_OWNER_PK], providerOrUrl: SEP_RPC });
  web3ForEns = new Web3(provider);
  ensAccount = provider.getAddress ? provider.getAddress(0) : provider.addresses && provider.addresses[0];
  console.log('[ENS] Prepared web3 with account', ensAccount);
} else {
  console.log('[ENS] Not fully configured (missing SEP_RPC or ENS_OWNER_PRIVATE_KEY). ENS write endpoints will return instructions.');
}
//  Endpoints 

// POST /generate-token
// body: { description: string }
app.post('/generate-token', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'description required' });

    // prompt: ask Gemini to return strict JSON (no extra text)
    const prompt = `
You are an expert token designer. Given a user description, output STRICT JSON ONLY with the fields:
{
  "name": "<token name>",
  "symbol": "<SYMBOL>",
  "type": "ERC20"|"ERC721",
  "supply": <integer>, 
  "decimals": <integer>,
  "features": { "mintable": true|false, "burnable": true|false, "pausable": true|false },
  "description": "<1-2 sentence landing description>",
  "suggestedLogoPrompt": "<short image prompt suitable for image generation or descriptive SVG>"
}
User description: "${description}"
Return only JSON.
`;

    // call Gemini
    const r = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    // Compatibility: some SDKs return .text or .outputText
    const text = r?.text || r?.outputText || (r?.candidates && r.candidates[0]?.content?.parts?.[0]?.text) || null;
    if (!text) {
      return res.status(500).json({ error: 'no response from LLM' });
    }

    // Parse the JSON (Gemini is usually good at obeying JSON mode)
    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch (e) {
      // sometimes model adds triple backticks or extra text; extract first JSON substring
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw e;
    }

    return res.json({ ok: true, generated: parsed, rawText: text });
  } catch (err) {
    console.error('generate-token err', err?.response?.data || err);
    res.status(500).json({ error: String(err?.message || err) });
  }
});

// POST /upload-logo
// body: { name, description, imageBase64 }  OR imageSvg string
app.post('/upload-logo', async (req, res) => {
  try {
    const { name, description, imageBase64, imageSvg } = req.body;
    if (!imageBase64 && !imageSvg) return res.status(400).json({ error: 'imageBase64 or imageSvg required' });

    let file;
    if (imageBase64) {
      // expect data URL "data:image/png;base64,...."
      const base64 = imageBase64.split(',')[1] || imageBase64;
      const buffer = Buffer.from(base64, 'base64');
      file = new File([buffer], `${name || 'logo'}.png`, { type: 'image/png' });
    } else {
      // svg
      const svgBuffer = Buffer.from(imageSvg, 'utf8');
      file = new File([svgBuffer], `${name || 'logo'}.svg`, { type: 'image/svg+xml' });
    }

    const cid = await nftClient.storeDirectory([file]); // returns CID for directory; using simple path
    // create metadata JSON and upload too
    const metadata = {
      name: name || 'EasyDeploy Token Logo',
      description: description || '',
      image: `ipfs://${cid}/` // note: exact path may differ; nft.storage stores files with paths
    };

    // store metadata as file (nft.storage has a simple put; we can use storeBlob() too)
    const metadataFile = new File([JSON.stringify(metadata)], 'metadata.json', { type: 'application/json' });
    const metaCid = await nftClient.storeDirectory([metadataFile]);

    return res.json({ ok: true, cid, metaCid, metadataUri: `ipfs://${metaCid}/metadata.json` });
  } catch (err) {
    console.error('upload-logo err', err);
    res.status(500).json({ error: String(err) });
  }
});

// ENS subname creation endpoint (must be called after token is deployed)
// body: { label: "latte", ownerAddress: "0x...", tokenAddress: "0x...", parentName: "easydeployai.eth" }
app.post('/ens/register-subname', async (req, res) => {
  try {
    if (!web3ForEns) return res.status(400).json({ error: 'ENS not configured on backend. Set SEPOLIA_RPC_URL and ENS_OWNER_PRIVATE_KEY.' });

    const { label, ownerAddress, tokenAddress, parentName = 'easydeployai.eth' } = req.body;
    if(!label || !ownerAddress || !tokenAddress) return res.status(400).json({ error: 'label, ownerAddress, tokenAddress required' });

    // confirm current owner of parentName on Sepolia
    const currentOwner = await web3ForEns.eth.ens.owner(parentName); // web3.js wrapper
    if(!currentOwner || currentOwner.toLowerCase() !== ensAccount.toLowerCase()) {
      return res.status(400).json({ error: `ENS owner mismatch. The backend's ENS owner ${ensAccount} is not the owner of ${parentName} on Sepolia. Current owner: ${currentOwner}. Ensure you own the parent name on Sepolia or run using your ENS owner key.`});
    }

    // create subnode and set owner to ownerAddress
    // web3.js ENS helper: setSubnodeOwner(name, label, address)
    console.log('[ENS] creating subnode', label, 'under', parentName);
    const tx = await web3ForEns.eth.ens.setSubnodeOwner(parentName, label, ownerAddress, { from: ensAccount });
    // set address record for the new subname
    const subname = `${label}.${parentName}`;
    const tx2 = await web3ForEns.eth.ens.setAddress(subname, tokenAddress, { from: ensAccount });

    return res.json({ ok: true, subname, tx, tx2 });
  } catch (err) {
    console.error('ens register err', err?.message || err);
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`EasyDeploy backend listening on ${PORT}`);
});
