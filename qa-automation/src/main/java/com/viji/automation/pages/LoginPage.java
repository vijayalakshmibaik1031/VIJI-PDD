package com.viji.automation.pages;

import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;

/**
 * Login Page Object Model
 * Encapsulates all login-related elements and interactions
 */
public class LoginPage {
    private WebDriver driver;
    private WebDriverWait wait;
    
    // Locators
    private By employeeIdField = By.id("employeeId");
    private By passwordField = By.id("password");
    private By loginButton = By.xpath("//button[contains(text(), 'Login')]");
    private By managerLoginBtn = By.cssSelector("button.manager-login");
    private By authorityLoginBtn = By.cssSelector("button.auth-login");
    private By errorMessage = By.xpath("//div[@class='error-message']");
    private By fieldError = By.xpath("//span[@class='field-error']");
    private By forgotPasswordLink = By.xpath("//a[contains(text(), 'Forgot Password')]");
    private By registerLink = By.xpath("//a[contains(text(), 'Register')]");
    private By loginContainer = By.cssSelector(".login-container");
    
    public LoginPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }
    
    /**
     * Wait for login page to load
     */
    public void waitForPageLoad() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(loginContainer));
    }
    
    /**
     * Enter employee ID
     */
    public LoginPage enterEmployeeId(String employeeId) {
        WebElement field = wait.until(ExpectedConditions.visibilityOfElementLocated(employeeIdField));
        field.clear();
        field.sendKeys(employeeId);
        return this;
    }
    
    /**
     * Enter password
     */
    public LoginPage enterPassword(String password) {
        WebElement field = driver.findElement(passwordField);
        field.clear();
        field.sendKeys(password);
        return this;
    }
    
    /**
     * Click login button
     */
    public void clickLoginButton() {
        WebElement button = wait.until(ExpectedConditions.elementToBeClickable(loginButton));
        button.click();
    }
    
    /**
     * Perform complete login
     */
    public void login(String employeeId, String password) {
        enterEmployeeId(employeeId);
        enterPassword(password);
        clickLoginButton();
    }
    
    /**
     * Click manager login option
     */
    public void clickManagerLogin() {
        WebElement button = wait.until(ExpectedConditions.elementToBeClickable(managerLoginBtn));
        button.click();
    }
    
    /**
     * Click authority login option
     */
    public void clickAuthorityLogin() {
        WebElement button = wait.until(ExpectedConditions.elementToBeClickable(authorityLoginBtn));
        button.click();
    }
    
    /**
     * Get error message
     */
    public String getErrorMessage() {
        try {
            WebElement error = wait.until(ExpectedConditions.visibilityOfElementLocated(errorMessage));
            return error.getText();
        } catch (TimeoutException e) {
            return "";
        }
    }
    
    /**
     * Get field error message
     */
    public String getFieldErrorMessage() {
        try {
            WebElement error = wait.until(ExpectedConditions.visibilityOfElementLocated(fieldError));
            return error.getText();
        } catch (TimeoutException e) {
            return "";
        }
    }
    
    /**
     * Click forgot password link
     */
    public void clickForgotPasswordLink() {
        WebElement link = wait.until(ExpectedConditions.elementToBeClickable(forgotPasswordLink));
        link.click();
    }
    
    /**
     * Click register link
     */
    public void clickRegisterLink() {
        WebElement link = wait.until(ExpectedConditions.elementToBeClickable(registerLink));
        link.click();
    }
    
    /**
     * Check if error message is displayed
     */
    public boolean isErrorMessageDisplayed() {
        try {
            return driver.findElement(errorMessage).isDisplayed();
        } catch (NoSuchElementException e) {
            return false;
        }
    }
}
