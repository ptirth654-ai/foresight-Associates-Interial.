@echo off
title Foresight Associates - Deploy to Vercel
echo ====================================================
echo  FORESIGHT ASSOCIATES - VERCEL ONE-CLICK DEPLOY
echo ====================================================
echo.
echo Step 1: Connecting to Vercel and preparing deployment...
echo (If this is your first time, a browser window will open to log in)
echo.
npx -y vercel
echo.
echo Step 2: Deploying to Production...
echo.
npx -y vercel --prod
echo.
echo ====================================================
echo  DEPLOYMENT COMPLETE!
echo  Your website is now live worldwide on Vercel.
echo ====================================================
pause

