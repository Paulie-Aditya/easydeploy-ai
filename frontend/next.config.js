/** @type {import('next').Config} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // Disable SWC minification to avoid binary issues
  experimental: {
    forceSwcTransforms: false, // Disable forced SWC transforms
  },
  webpack: (config, { isServer }) => {
    // Fallback for SWC issues and Chrome extension errors
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        buffer: false,
      };
      
      // Ignore WalletConnect warnings
      config.ignoreWarnings = [
        /Failed to fetch remote project configuration/,
        /WalletConnect Core is already initialized/,
        /chrome.runtime.sendMessage/,
        /Error in invocation of runtime.sendMessage/,
      ];
      
      // Handle Chrome extension conflicts
      config.externals = config.externals || [];
      config.externals.push({
        'chrome-extension://opfgelmcmbiajamepnmloijbpoleiama': 'chrome-extension://opfgelmcmbiajamepnmloijbpoleiama',
      });
    }
    return config;
  },
}

module.exports = nextConfig
