import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/e2e',testMatch:'**/*.pw.ts',timeout:120000,workers:1,reporter:'list',use:{baseURL:'http://127.0.0.1:5173',browserName:'chromium',channel:'chromium',actionTimeout:15000},webServer:{command:'npm run dev -- --port 5173',url:'http://127.0.0.1:5173',reuseExistingServer:true}});
