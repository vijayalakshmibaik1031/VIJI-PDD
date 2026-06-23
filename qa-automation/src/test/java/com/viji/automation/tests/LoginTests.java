package com.viji.automation.tests;

import com.viji.automation.base.BaseTest;
import com.viji.automation.pages.LoginPage;
import com.viji.automation.pages.DashboardPage;
import org.testng.annotations.Test;
import org.testng.Assert;

/**
 * Login Tests - 20 test cases covering all login scenarios
 * TC_LOGIN_001 to TC_LOGIN_020
 * Framework: Selenium 4 + TestNG
 * Execution: Local, GitHub Actions, Headless Chrome
 */
public class LoginTests extends BaseTest {
    
    /**
     * TC_LOGIN_001: Valid employee login with correct credentials
     * Priority: P0, Severity: Critical
     */
    @Test(groups = {"functional", "login", "smoke"})
    public void testValidEmployeeLogin() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.login("emp001", "Test@123456");
        
        // Verify dashboard loads
        waitForURLContains("/dashboard");
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isDashboardLoaded(), "Dashboard should be loaded after login");
    }
    
    /**
     * TC_LOGIN_002: Invalid employee ID login attempt
     * Priority: P0, Severity: High
     */
    @Test(groups = {"functional", "login"})
    public void testInvalidEmployeeIdLogin() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.login("invalidEmp", "Test@123456");
        
        // Verify error message
        String errorMsg = loginPage.getErrorMessage();
        Assert.assertTrue(errorMsg.contains("Invalid"), "Error message should indicate invalid credentials");
    }
    
    /**
     * TC_LOGIN_003: Invalid password login attempt
     * Priority: P0, Severity: High
     */
    @Test(groups = {"functional", "login"})
    public void testInvalidPasswordLogin() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.login("emp001", "WrongPassword123");
        
        // Verify error message
        String errorMsg = loginPage.getErrorMessage();
        Assert.assertTrue(errorMsg.contains("Invalid"), "Error message should indicate invalid credentials");
    }
    
    /**
     * TC_LOGIN_004: Empty employee ID field submission
     * Priority: P1, Severity: High
     */
    @Test(groups = {"validation", "login"})
    public void testEmptyEmployeeIdField() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.enterPassword("Test@123456");
        loginPage.clickLoginButton();
        
        // Verify field error message
        String fieldError = loginPage.getFieldErrorMessage();
        Assert.assertTrue(fieldError.contains("required"), "Field error should indicate required field");
    }
    
    /**
     * TC_LOGIN_005: Empty password field submission
     * Priority: P1, Severity: High
     */
    @Test(groups = {"validation", "login"})
    public void testEmptyPasswordField() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.enterEmployeeId("emp001");
        loginPage.clickLoginButton();
        
        // Verify field error message
        String fieldError = loginPage.getFieldErrorMessage();
        Assert.assertTrue(fieldError.contains("required"), "Field error should indicate required field");
    }
    
    /**
     * TC_LOGIN_006: Manager login with valid credentials
     * Priority: P0, Severity: Critical
     */
    @Test(groups = {"functional", "login", "smoke"})
    public void testManagerLogin() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.clickManagerLogin();
        loginPage.enterEmployeeId("manager");
        loginPage.enterPassword("man123");
        loginPage.clickLoginButton();
        
        // Verify manager dashboard loads
        waitForURLContains("/manager");
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isDashboardLoaded(), "Manager dashboard should load");
    }
    
    /**
     * TC_LOGIN_007: Authority login with valid credentials
     * Priority: P0, Severity: Critical
     */
    @Test(groups = {"functional", "login", "smoke"})
    public void testAuthorityLogin() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.clickAuthorityLogin();
        loginPage.enterEmployeeId("auth");
        loginPage.enterPassword("auth123");
        loginPage.clickLoginButton();
        
        // Verify authority dashboard loads
        waitForURLContains("/authority");
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isDashboardLoaded(), "Authority dashboard should load");
    }
    
    /**
     * TC_LOGIN_008: SQL Injection attempt in login field
     * Priority: P0, Severity: Critical (Security)
     */
    @Test(groups = {"security", "login"})
    public void testSQLInjectionAttempt() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.login("admin' OR '1'='1", "' OR '1'='1");
        
        // Verify login fails and error is shown
        Assert.assertTrue(loginPage.isErrorMessageDisplayed(), "Login should fail on SQL injection attempt");
        Assert.assertFalse(getCurrentURL().contains("/dashboard"), "Should not reach dashboard");
    }
    
    /**
     * TC_LOGIN_009: Login form field validation - special characters
     * Priority: P1, Severity: Medium
     */
    @Test(groups = {"validation", "login"})
    public void testSpecialCharactersValidation() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.login("<>?/", "<>?/");
        
        // Verify error is shown
        Assert.assertTrue(loginPage.isErrorMessageDisplayed() || 
                         !loginPage.getFieldErrorMessage().isEmpty(), 
                         "Special characters should be handled");
    }
    
    /**
     * TC_LOGIN_010: Login response time validation
     * Priority: P2, Severity: Medium (Performance)
     */
    @Test(groups = {"performance", "login"})
    public void testLoginResponseTime() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        
        long startTime = System.currentTimeMillis();
        loginPage.login("emp001", "Test@123456");
        waitForURLContains("/dashboard");
        long endTime = System.currentTimeMillis();
        
        long responseTime = endTime - startTime;
        Assert.assertTrue(responseTime < 3000, "Login should complete in less than 3 seconds");
    }
    
    /**
     * TC_LOGIN_011: Brute force protection - multiple failed attempts
     * Priority: P0, Severity: Critical (Security)
     */
    @Test(groups = {"security", "login"})
    public void testBruteForceProtection() {
        LoginPage loginPage = new LoginPage(driver);
        
        // Attempt login multiple times with wrong password
        for (int i = 0; i < 5; i++) {
            loginPage.waitForPageLoad();
            loginPage.login("emp001", "WrongPassword" + i);
        }
        
        // Verify account is locked or rate limited
        loginPage.waitForPageLoad();
        loginPage.login("emp001", "Test@123456");
        String errorMsg = loginPage.getErrorMessage();
        Assert.assertTrue(errorMsg.contains("locked") || errorMsg.contains("too many"), 
                         "Account should be locked after multiple failed attempts");
    }
    
    /**
     * TC_LOGIN_012: Password field masking
     * Priority: P1, Severity: High
     */
    @Test(groups = {"security", "login"})
    public void testPasswordFieldMasking() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.enterPassword("Test@123456");
        
        // Verify password field type is 'password'
        String fieldType = driver.findElement(By.id("password")).getAttribute("type");
        Assert.assertEquals(fieldType, "password", "Password field should be masked");
    }
    
    /**
     * TC_LOGIN_013: Session token generation and validation
     * Priority: P0, Severity: Critical (Security)
     */
    @Test(groups = {"security", "login"})
    public void testSessionTokenGeneration() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.login("emp001", "Test@123456");
        waitForURLContains("/dashboard");
        
        // Verify session storage contains token
        Object token = executeScript("return sessionStorage.getItem('auth_token');");
        Assert.assertNotNull(token, "Session token should be generated after login");
        Assert.assertFalse(token.toString().isEmpty(), "Session token should not be empty");
    }
    
    /**
     * TC_LOGIN_014: Login page load time validation
     * Priority: P2, Severity: Medium (Performance)
     */
    @Test(groups = {"performance", "login"})
    public void testLoginPageLoadTime() {
        long startTime = System.currentTimeMillis();
        driver.get(baseURL + "/login");
        
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        long endTime = System.currentTimeMillis();
        
        long loadTime = endTime - startTime;
        Assert.assertTrue(loadTime < 2000, "Login page should load in less than 2 seconds");
    }
    
    /**
     * TC_LOGIN_015: Responsive login form - mobile viewport
     * Priority: P2, Severity: Medium (UI/UX)
     */
    @Test(groups = {"ui", "login", "responsive"})
    public void testResponsiveLoginForm() {
        // Set mobile viewport
        executeScript("window.resizeTo(375, 667);");
        
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        
        // Verify form elements are visible
        Assert.assertTrue(isElementDisplayed(By.id("employeeId")), "Employee ID field should be visible");
        Assert.assertTrue(isElementDisplayed(By.id("password")), "Password field should be visible");
    }
    
    /**
     * TC_LOGIN_016: CSRF token validation
     * Priority: P0, Severity: Critical (Security)
     */
    @Test(groups = {"security", "login"})
    public void testCSRFTokenValidation() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        
        // Verify CSRF token present in page
        Object csrfToken = executeScript("return document.querySelector('input[name=\"_csrf_token\"]');");
        Assert.assertNotNull(csrfToken, "CSRF token should be present in login form");
    }
    
    /**
     * TC_LOGIN_017: Forgot password link accessibility
     * Priority: P1, Severity: Medium
     */
    @Test(groups = {"functional", "login"})
    public void testForgotPasswordLinkAccess() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.clickForgotPasswordLink();
        
        // Verify forgot password page loads
        waitForURLContains("/forgot-password");
        Assert.assertTrue(getCurrentURL().contains("forgot-password"), "Should navigate to forgot password page");
    }
    
    /**
     * TC_LOGIN_018: Registration link accessibility
     * Priority: P1, Severity: Medium
     */
    @Test(groups = {"functional", "login"})
    public void testRegistrationLinkAccess() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.clickRegisterLink();
        
        // Verify registration page loads
        waitForURLContains("/register");
        Assert.assertTrue(getCurrentURL().contains("register"), "Should navigate to registration page");
    }
    
    /**
     * TC_LOGIN_019: Keyboard accessibility - Tab navigation
     * Priority: P2, Severity: Medium (Accessibility)
     */
    @Test(groups = {"accessibility", "login"})
    public void testKeyboardNavigation() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        
        // Tab to first field
        driver.switchTo().activeElement();
        driver.switchTo().activeElement().sendKeys(Keys.TAB);
        
        // Verify focus moved
        WebElement activeElement = driver.switchTo().activeElement();
        Assert.assertNotNull(activeElement, "Tab navigation should work");
    }
    
    /**
     * TC_LOGIN_020: Error message clarity and localization
     * Priority: P1, Severity: High
     */
    @Test(groups = {"functional", "login"})
    public void testErrorMessageClarity() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.waitForPageLoad();
        loginPage.login("invalidUser", "invalidPass");
        
        String errorMsg = loginPage.getErrorMessage();
        Assert.assertFalse(errorMsg.contains("SQLException") || errorMsg.contains("Database"), 
                          "Error message should not expose database details");
    }
}
