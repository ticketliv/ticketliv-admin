import { chromium } from 'playwright';
import path from 'path';

async function runTest() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login');
    
    console.log('Filling login form...');
    await page.fill('#email', 'admin@ticketliv.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for dashboard...');
    await page.waitForTimeout(3000);
    
    const screenshotPath = 'admin_dashboard_check.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);
    
    const h2 = await page.innerText('h2');
    console.log('Page Title:', h2);
    
    // Check sidebar visibility
    const sidebar = await page.isVisible('.sidebar');
    console.log('Sidebar Visible:', sidebar);
    
  } catch (err) {
    console.error('Test failed:', err);
    await page.screenshot({ path: 'login_fail.png' });
  } finally {
    await browser.close();
  }
}

runTest();
