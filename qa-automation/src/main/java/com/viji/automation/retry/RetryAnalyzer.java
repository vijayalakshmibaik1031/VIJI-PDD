package com.viji.automation.retry;

import org.testng.IRetryAnalyzer;
import org.testng.ITestResult;

/**
 * Test Retry Analyzer - Handles flaky test retries
 * Implements intelligent retry logic for non-deterministic failures
 * Avoids retrying tests that failed for valid reasons
 */
public class RetryAnalyzer implements IRetryAnalyzer {
    
    private int retryCount = 0;
    private static final int MAX_RETRIES = 2;
    
    /**
     * Determines if test should be retried
     */
    @Override
    public boolean retry(ITestResult result) {
        if (retryCount < MAX_RETRIES) {
            // Don't retry if assertion failed (test logic error)
            Throwable throwable = result.getThrowable();
            if (throwable != null) {
                String message = throwable.getMessage();
                
                // Don't retry assertion errors
                if (message != null && message.contains("AssertionError")) {
                    return false;
                }
                
                // Don't retry security/validation errors
                if (message != null && (
                    message.contains("Security") || 
                    message.contains("Unauthorized") ||
                    message.contains("Permission denied"))) {
                    return false;
                }
                
                // Retry on timeout exceptions (flaky)
                if (throwable instanceof java.util.concurrent.TimeoutException ||
                    message != null && message.contains("Timeout")) {
                    retryCount++;
                    System.out.println("\nRetrying test: " + result.getName() + 
                        " (Attempt " + (retryCount + 1) + " of " + (MAX_RETRIES + 1) + ")");
                    return true;
                }
                
                // Retry on stale element exceptions
                if (throwable instanceof org.openqa.selenium.StaleElementReferenceException) {
                    retryCount++;
                    System.out.println("\nRetrying test: " + result.getName() + 
                        " (Attempt " + (retryCount + 1) + " of " + (MAX_RETRIES + 1) + ")");
                    return true;
                }
                
                // Retry on element not found (might be timing issue)
                if (throwable instanceof org.openqa.selenium.NoSuchElementException) {
                    retryCount++;
                    System.out.println("\nRetrying test: " + result.getName() + 
                        " (Attempt " + (retryCount + 1) + " of " + (MAX_RETRIES + 1) + ")");
                    return true;
                }
                
                // Retry on element not clickable
                if (message != null && message.contains("not clickable")) {
                    retryCount++;
                    System.out.println("\nRetrying test: " + result.getName() + 
                        " (Attempt " + (retryCount + 1) + " of " + (MAX_RETRIES + 1) + ")");
                    return true;
                }
                
                // Retry on connection/network errors
                if (message != null && (
                    message.contains("Connection refused") ||
                    message.contains("Connection reset") ||
                    message.contains("ERR_CONNECTION"))) {
                    retryCount++;
                    System.out.println("\nRetrying test: " + result.getName() + 
                        " (Attempt " + (retryCount + 1) + " of " + (MAX_RETRIES + 1) + ")");
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Reset retry count for each test
     */
    public void setRetryCount(int count) {
        this.retryCount = count;
    }
}
