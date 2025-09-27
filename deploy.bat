@echo off
echo 🚀 Starting EasyDeployAI deployment...

REM Check if required environment variables are set
if "%GEMINI_API_KEY%"=="" (
    echo ❌ GEMINI_API_KEY is not set
    exit /b 1
)

if "%NFT_STORAGE_KEY%"=="" (
    echo ❌ NFT_STORAGE_KEY is not set
    exit /b 1
)

if "%SEPOLIA_RPC_URL%"=="" (
    echo ❌ SEPOLIA_RPC_URL is not set
    exit /b 1
)

if "%ENS_OWNER_PRIVATE_KEY%"=="" (
    echo ❌ ENS_OWNER_PRIVATE_KEY is not set
    exit /b 1
)

echo ✅ Environment variables check passed

REM Deploy contracts
echo 📦 Deploying contracts to Sepolia...
cd contracts
call npm install
call npx hardhat compile
call npx hardhat run scripts/deployFactory.js --network sepolia
cd ..

REM Install backend dependencies
echo 🔧 Installing backend dependencies...
cd backend
call npm install
cd ..

REM Install frontend dependencies
echo 🔧 Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo ✅ Deployment complete!
echo.
echo To start the application:
echo 1. Backend: cd backend ^&^& npm start
echo 2. Frontend: cd frontend ^&^& npm run dev
echo.
echo Make sure to set NEXT_PUBLIC_FACTORY_ADDRESS in frontend/.env.local
