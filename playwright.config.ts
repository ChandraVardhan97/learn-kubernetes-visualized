import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',timeout:45000,fullyParallel:false,workers:1,reporter:'list',
 use:{baseURL:process.env.KV_BASE_URL||'http://127.0.0.1:4322',headless:true,channel:'chrome',trace:'retain-on-failure',screenshot:'only-on-failure'},
});
