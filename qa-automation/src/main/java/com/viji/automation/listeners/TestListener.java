package com.viji.automation.listeners;

import com.aventstack.extentreports.ExtentTest;
import com.aventstack.extentreports.Status;
import com.viji.automation.reporting.ExtentReportManager;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * Test Listener - Handles test events and report generation
 * Captures screenshots on failure, logs test status
 */
public class TestListener implements ITestListener {
    
    private static final ThreadLocal<ExtentTest> extentTest = new ThreadLocal<>();
    private static final ThreadLocal<WebDriver> driver = new ThreadLocal<>();
    
    /**
     * On test start
     */
    @Override
    public void onTestStart(ITestResult result) {
        String testName = result.getName();
        String testClass = result.getTestClass().getName();
        String testMethod = result.getMethod().getMethodName();
        
        ExtentTest test = ExtentReportManager.getInstance()
            .createTest(testName)
            .assignCategory(testClass)
            .assignAuthor("QA Automation");
        
        extentTest.set(test);
        
        System.out.println("\n" + "=".repeat(80));
        System.out.println("Test Started: " + testName);
        System.out.println("Method: " + testMethod);
        System.out.println("=".repeat(80));
    }
    
    /**
     * On test success
     */
    @Override
    public void onTestSuccess(ITestResult result) {
        ExtentTest test = extentTest.get();
        if (test != null) {
            test.log(Status.PASS, "Test Passed: " + result.getName());
        }
        System.out.println("✓ Test PASSED: " + result.getName());
    }
    
    /**
     * On test failure
     */
    @Override
    public void onTestFailure(ITestResult result) {
        ExtentTest test = extentTest.get();
        
        if (test != null) {
            test.log(Status.FAIL, "Test Failed: " + result.getThrowable());
            
            // Capture screenshot
            try {
                WebDriver webDriver = getDriver(result);
                if (webDriver != null) {
                    String screenshotPath = captureScreenshot(
                        webDriver,
                        result.getName() + "_" + System.currentTimeMillis()
                    );
                    test.addScreenCaptureFromPath(screenshotPath);
                    test.log(Status.INFO, "Screenshot attached: " + screenshotPath);
                }
            } catch (Exception e) {
                test.log(Status.WARNING, "Could not capture screenshot: " + e.getMessage());
            }
        }
        
        System.out.println("✗ Test FAILED: " + result.getName());
        System.out.println("Error: " + result.getThrowable());
    }
    
    /**
     * On test skip
     */
    @Override
    public void onTestSkipped(ITestResult result) {
        ExtentTest test = extentTest.get();
        if (test != null) {
            test.log(Status.SKIP, "Test Skipped: " + result.getName());
        }
        System.out.println("⊘ Test SKIPPED: " + result.getName());
    }
    
    /**
     * On test failure but within success percentage
     */
    @Override
    public void onTestFailedButWithinSuccessPercentage(ITestResult result) {
        ExtentTest test = extentTest.get();
        if (test != null) {
            test.log(Status.WARNING, "Test Failed But Within Success Percentage");
        }
    }
    
    /**
     * On start
     */
    @Override
    public void onStart(ITestContext context) {
        System.out.println("\n" + "=".repeat(80));
        System.out.println("Test Suite Started: " + context.getName());
        System.out.println("Total Tests: " + context.getAllTestMethods().length);
        System.out.println("=".repeat(80));
    }
    
    /**
     * On finish
     */
    @Override
    public void onFinish(ITestContext context) {
        System.out.println("\n" + "=".repeat(80));
        System.out.println("Test Suite Finished: " + context.getName());
        System.out.println("Passed: " + context.getPassedTests().size());
        System.out.println("Failed: " + context.getFailedTests().size());
        System.out.println("Skipped: " + context.getSkippedTests().size());
        System.out.println("=".repeat(80) + "\n");
        
        ExtentReportManager.flushReports();
    }
    
    /**
     * Capture screenshot
     */
    private String captureScreenshot(WebDriver webDriver, String screenshotName) {
        try {
            String screenshotPath = "screenshots/" + screenshotName + ".png";
            new File("screenshots").mkdirs();
            
            TakesScreenshot screenshot = (TakesScreenshot) webDriver;
            File srcFile = screenshot.getScreenshotAs(OutputType.FILE);
            Files.copy(srcFile.toPath(), Paths.get(screenshotPath));
            
            return screenshotPath;
        } catch (IOException e) {
            System.out.println("Error capturing screenshot: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Get WebDriver from test result
     */
    private WebDriver getDriver(ITestResult result) {
        try {
            return (WebDriver) result.getInstance();
        } catch (Exception e) {
            return null;
        }
    }
    
    public static ExtentTest getExtentTest() {
        return extentTest.get();
    }
    
    public static void setDriver(WebDriver webDriver) {
        driver.set(webDriver);
    }
    
    public static WebDriver getWebDriver() {
        return driver.get();
    }
}
