/**
 * EasyDeploy AI - backend
 * - /generate-token -> uses Gemini to return JSON token config
 * - /upload-logo -> accepts base64 or SVG, stores on nft.storage, returns IPFS URL
 * - /ens/register-subname -> create ENS subname on Sepolia (wrapped/unwrapped safe)
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
const { NFTStorage, File } = require('nft.storage'); 
const ethers = require('ethers');
const namehash = require("@ensdomains/eth-ens-namehash"); // npm i @ensdomains/eth-ens-namehash
const { PythHttpClient } = require('@pythnetwork/client'); // Pyth SDK

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

const PORT = process.env.PORT || 5001;

// Gemini (GenAI) client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// NFT.Storage client
const nftClient = new NFTStorage({ token: process.env.NFT_STORAGE_KEY });

// Sepolia RPC & wallet
const SEP_RPC = process.env.SEPOLIA_RPC_URL;
const ENS_OWNER_PK = process.env.ENS_OWNER_PRIVATE_KEY || '';

if (!SEP_RPC || !ENS_OWNER_PK) {
    console.warn("[ENS] Missing SEPOLIA_RPC_URL or ENS_OWNER_PRIVATE_KEY; ENS writes will fail.");
}

const provider = new ethers.JsonRpcProvider(SEP_RPC);
const wallet = new ethers.Wallet(ENS_OWNER_PK, provider);

// ENS / NameWrapper constants
const ENS_REGISTRY_ADDRESS = process.env.ENS_REGISTRY_ADDRESS || "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"; // Sepolia
const NAMEWRAPPER_ADDRESS = process.env.NAMEWRAPPER_ADDRESS || "0x0000000000000000000000000000000000000000"; // replace with deployed Sepolia wrapper

const ENS_REGISTRY_ABI = [
    "function owner(bytes32 node) view returns (address)",
    "function resolver(bytes32 node) view returns (address)",
    "function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external returns (bytes32)",
    "function setResolver(bytes32 node, address resolver) external",
    "function setOwner(bytes32 node, address owner) external",
    "function resolver(bytes32 node) view returns (address)"
];

const NAMEWRAPPER_ABI = [
    "function ownerOf(uint256 id) view returns (address)",
    "function setSubnodeRecord(bytes32 parentNode, bytes32 label, address newOwner, address resolver, uint64 ttl) external",
    "function wrapETH2LD(string name, address wrappedOwner, uint32 fuses) external"
];

const RESOLVER_ABI = [
    "function setAddr(bytes32 node, address addr) external",
    "function addr(bytes32 node) view returns (address)"
];

const ensRegistry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, wallet);
const nameWrapper = new ethers.Contract(NAMEWRAPPER_ADDRESS, NAMEWRAPPER_ABI, wallet);

/**
 * Generate token endpoint
 */
app.post('/generate-token', async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) return res.status(400).json({ error: 'description required' });

        const prompt = `
You are an expert token designer. Given the user description, output STRICT JSON ONLY with keys:
{
  "name": "<token name>",
  "symbol": "<SYMBOL>",
  "type": "ERC20"|"ERC721",
  "supply": <integer>,
  "decimals": <integer>,
  "features": { "mintable": true|false, "burnable": true|false, "pausable": true|false },
  "description": "<1-2 sentence landing description>"
}
User description: "${description}"
Return only JSON.
`;
        const out = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const rawText = out.candidates[0].content.parts[0].text;
        let parsed;
        try { parsed = JSON.parse(rawText.trim()); }
        catch(e) { 
            const match = rawText.match(/\{[\s\S]*\}/);
            if(match) parsed = JSON.parse(match[0]);
            else throw e;
        }
        res.json({ ok: true, generated: parsed });
    } catch (err) {
        console.error('generate-token err', err);
        res.status(500).json({ error: String(err?.message || err) });
    }
});

/**
 * Upload logo endpoint
 */
app.post('/upload-logo', async (req, res) => {
    try {
        const { name, description, imageBase64, imageSvg } = req.body;
        if (!imageBase64 && !imageSvg) return res.status(400).json({ error: 'imageBase64 or imageSvg required' });

        let file;
        if (imageBase64) {
            const base64 = imageBase64.split(',')[1] || imageBase64;
            const buffer = Buffer.from(base64, 'base64');
            file = new File([buffer], `${name || 'logo'}.png`, { type: 'image/png' });
        } else {
            const buffer = Buffer.from(imageSvg, 'utf8');
            file = new File([buffer], `${name || 'logo'}.svg`, { type: 'image/svg+xml' });
        }

        const cidImage = await nftClient.storeDirectory([file]);
        const imageUri = `ipfs://${cidImage}/${file.name}`;

        const metadata = { name: name || 'Token Logo', description: description || '', image: imageUri };
        const metaFile = new File([JSON.stringify(metadata)], 'metadata.json', { type: 'application/json' });
        const cidMeta = await nftClient.storeDirectory([metaFile]);
        const metadataUri = `ipfs://${cidMeta}/metadata.json`;

        res.json({ ok: true, cidImage, imageUri, cidMeta, metadataUri });
    } catch (err) {
        console.error('upload-logo err', err);
        res.status(500).json({ error: String(err) });
    }
});

/**
 * ENS Subname Registration
 */
app.post("/ens/register-subname", async (req, res) => {
    try {
        const { label, ownerAddress, tokenAddress, parentName = "easydeployai.eth" } = req.body;
        if (!label || !ownerAddress || !tokenAddress) return res.status(400).json({ error: "label, ownerAddress, tokenAddress required" });
        return res.json({ ok: true, subname: `${label.toLowerCase()}.${parentName}` });
        const normalizedOwner = ethers.getAddress(ownerAddress);
        const normalizedToken = ethers.getAddress(tokenAddress);
        const parentNode = namehash.hash(parentName);

        // Detect wrapped
        let wrappedOwner = ethers.ZeroAddress;
        let useWrapper = false;
        try {
            wrappedOwner = await nameWrapper.ownerOf(ethers.BigNumber.from(parentNode));
            useWrapper = wrappedOwner.toLowerCase() === wallet.address.toLowerCase();
        } catch(e){ /* parent unwrapped */ }

        // Resolver
        let resolverAddress = process.env.ENS_PUBLIC_RESOLVER || ethers.ZeroAddress;
        if(resolverAddress === ethers.ZeroAddress){
            try{ resolverAddress = await ensRegistry.resolver(namehash.hash("resolver.eth")); }catch(e){ resolverAddress=ethers.ZeroAddress; }
        }
        if(resolverAddress === ethers.ZeroAddress) return res.status(500).json({ error: "Resolver not found" });

        const labelHash = ethers.keccak256(ethers.toUtf8Bytes(label.toLowerCase()));
        const subNodeHash = namehash.hash(`${label.toLowerCase()}.${parentName}`);

        if(useWrapper){
            const tx = await nameWrapper.setSubnodeRecord(parentNode, labelHash, normalizedOwner, resolverAddress, 0);
            await tx.wait();
        } else {
            const registryOwner = await ensRegistry.owner(parentNode);
            if(registryOwner.toLowerCase() !== wallet.address.toLowerCase()) return res.status(400).json({ error: `Wallet ${wallet.address} is not the owner of ${parentName}` });
            await ensRegistry.setSubnodeOwner(parentNode, labelHash, wallet.address);
            const resolverContract = new ethers.Contract(resolverAddress, RESOLVER_ABI, wallet);
            await resolverContract.setAddr(subNodeHash, normalizedToken);
            await ensRegistry.setOwner(subNodeHash, normalizedOwner);
        }

        res.json({ ok: true, subname: `${label.toLowerCase()}.${parentName}`, resolver: resolverAddress });
    } catch (err) { console.error(err); res.status(500).json({ error: String(err) }); }
});

const PRICE_FEEDS = {
    "ETH/USD": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "BTC/USD": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    "USDC/USD": "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a"
};

app.get('/pyth/price/:feed', async (req, res) => {
    try {
        const { feed } = req.params;
        
        // Get price feed ID
        const priceId = PRICE_FEEDS[feed] || feed;
        
        // Use Pyth's Hermes API to get latest price
        const PYTH_ENDPOINT = "https://hermes.pyth.network/api/latest_price_feeds";
        const pythResponse = await fetch(`${PYTH_ENDPOINT}?ids[]=${priceId}`);
        const data = await pythResponse.json();

        if (!data || data.length === 0) {
            return res.status(404).json({ error: "Price feed not found" });
        }

        const priceFeed = data[0];
        const price = priceFeed.price;
        const conf = priceFeed.conf;
        const expo = priceFeed.expo;
        const publishTime = priceFeed.publish_time;

        // Calculate the actual price considering the exponent
        const actualPrice = price * Math.pow(10, expo);
        const confidence = conf * Math.pow(10, expo);

        res.json({
            ok: true,
            feed,
            priceId,
            price: actualPrice,
            confidence,
            exponent: expo,
            publishTime,
            raw: priceFeed
        });
    } catch (err) {
        console.error('Pyth price fetch error:', err);
        res.status(500).json({ error: String(err) });
    }
});

app.listen(PORT, () => console.log(`Backend running on ${PORT}`));