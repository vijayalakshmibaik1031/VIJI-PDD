package com.viji.automation.base;

import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.testng.annotations.*;
import io.github.bonigarcia.wdm.WebDriverManager;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Base Test Class - Handles WebDriver initialization and teardown
 * Supports local execution, headless mode, and CI/CD environments
 * Features: Explicit waits, retry mechanisms, screenshot capture
 */
public class BaseTest {
    protected WebDriver driver;
    protected WebDriverWait wait;
    protected String baseURL;
    protected static final long EXPLICIT_WAIT_TIMEOUT = 10;
    protected static final long PAGE_LOAD_TIMEOUT = 15;
    
    /**
     * Initialize WebDriver based on environment and browser type
     */
    @BeforeMethod(alwaysRun = true)
    public void setUp() {
        String browser = System.getProperty("browser", "chrome").toLowerCase();
        String headless = System.getProperty("headless", "true");
        baseURL = System.getProperty("baseURL", "http://localhost:3000");
        
        switch(browser) {
            case "firefox":
                setupFirefox(headless.equals("true"));
                break;
            case "chrome":
            default:
                setupChrome(headless.equals("true"));
                break;
        }
        
        // Initialize waits
        wait = new WebDriverWait(driver, Duration.ofSeconds(EXPLICIT_WAIT_TIMEOUT));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(PAGE_LOAD_TIMEOUT));
        
        // Navigate to base URL
        driver.get(baseURL);
    }
    
    /**
     * Setup Chrome browser with appropriate options
     */
    private void setupChrome(boolean headless) {
        WebDriverManager.chromedriver().setup();
        ChromeOptions options = new ChromeOptions();
        
        if (headless) {
            options.addArguments("--headless=new");
        }
        
        options.addArguments("--disable-blink-features=AutomationControlled");
        options.addArguments("--disable-web-resources-type-handling");
        options.addArguments("--no-default-browser-check");
        options.addArguments("--no-first-run");
        options.addArguments("--disable-popup-blocking");
        options.addArguments("--disable-default-apps");
        options.addArguments("--disable-extensions");
        options.addArguments("--start-maximized");
        options.addArguments("--window-size=1920,1080");
        
        // CI/CD optimizations
        if (System.getenv("CI") != null) {
            options.addArguments("--no-sandbox");
            options.addArguments("--disable-dev-shm-usage");
            options.addArguments("--disable-gpu");
        }
        
        driver = new ChromeDriver(options);
    }
    
    /**
     * Setup Firefox browser with appropriate options
     */
    private void setupFirefox(boolean headless) {
        WebDriverManager.firefoxdriver().setup();
        FirefoxOptions options = new FirefoxOptions();
        
        if (headless) {
            options.addArguments("--headless");
        }
        
        options.addArguments("--start-maximized");
        options.setPageLoadStrategy(org.openqa.selenium.PageLoadStrategy.NORMAL);
        
        driver = new FirefoxDriver(options);
    }
    
    /**
     * Teardown - close WebDriver and cleanup
     */
    @AfterMethod(alwaysRun = true)
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
    
    /**
     * Wait for element to be clickable
     */
    protected WebElement waitForElementToBeClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }
    
    /**
     * Wait for element to be visible
     */
    protected WebElement waitForElementToBeVisible(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }
    
    /**
     * Wait for element presence
     */
    protected WebElement waitForElementPresence(By locator) {
        return wait.until(ExpectedConditions.presenceOfElementLocated(locator));
    }
    
    /**
     * Wait for all elements visibility
     */
    protected java.util.List<WebElement> waitForAllElementsVisible(By locator) {
        return wait.until(ExpectedConditions.visibilityOfAllElementsLocatedBy(locator));
    }
    
    /**
     * Execute JavaScript
     */
    protected Object executeScript(String script, Object... args) {
        JavascriptExecutor js = (JavascriptExecutor) driver;
        return js.executeScript(script, args);
    }
    
    /**
     * Take screenshot for failure analysis
     */
    protected String takeScreenshot(String fileName) {
        try {
            TakesScreenshot screenshot = (TakesScreenshot) driver;
            File srcFile = screenshot.getScreenshotAs(OutputType.FILE);
            File destFile = new File("screenshots/" + fileName + ".png");
            destFile.getParentFile().mkdirs();
            org.apache.commons.io.FileUtils.copyFile(srcFile, destFile);
            return destFile.getAbsolutePath();
        } catch (Exception e) {
            System.out.println("Error taking screenshot: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Get current URL
     */
    protected String getCurrentURL() {
        return driver.getCurrentUrl();
    }
    
    /**
     * Get page title
     */
    protected String getPageTitle() {
        return driver.getTitle();
    }
    
    /**
     * Wait for URL contains
     */
    protected boolean waitForURLContains(String urlPart) {
        return wait.until(ExpectedConditions.urlContains(urlPart));
    }
    
    /**
     * Scroll to element
     */
    protected void scrollToElement(WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", element);
    }
    
    /**
     * Click element with JavaScript (for stubborn elements)
     */
    protected void jsClick(WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
    }
    
    /**
     * Clear text field and enter new text
     */
    protected void clearAndSendKeys(WebElement element, String text) {
        element.clear();
        element.sendKeys(text);
    }
    
    /**
     * Verify element is displayed
     */
    protected boolean isElementDisplayed(By locator) {
        try {
            return driver.findElement(locator).isDisplayed();
        } catch (NoSuchElementException | StaleElementReferenceException e) {
            return false;
        }
    }
}
