package com.viji.automation.pages;

import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import java.time.Duration;
import java.util.List;

/**
 * Dashboard Page Object Model
 * Encapsulates dashboard elements and interactions
 */
public class DashboardPage {
    private WebDriver driver;
    private WebDriverWait wait;
    
    // Locators
    private By dashboardContainer = By.cssSelector(".dashboard-container");
    private By createComplaintBtn = By.xpath("//button[contains(text(), 'Create Complaint')]");
    private By complaintTable = By.xpath("//table[@class='data-table']");
    private By complaintRows = By.xpath("//table[@class='data-table']//tbody//tr");
    private By logoutButton = By.xpath("//button[@class='logout-btn']");
    private By userGreeting = By.cssSelector(".user-greeting");
    private By refreshButton = By.xpath("//button[@class='refresh-btn']");
    private By filterButton = By.xpath("//button[@class='filter-btn']");
    private By paginationContainer = By.xpath("//div[@class='pagination-controls']");
    private By summaryCard = By.xpath("//div[@class='summary-card']");
    
    public DashboardPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }
    
    /**
     * Wait for dashboard to load
     */
    public void waitForPageLoad() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(dashboardContainer));
    }
    
    /**
     * Click create complaint button
     */
    public void clickCreateComplaintButton() {
        WebElement button = wait.until(ExpectedConditions.elementToBeClickable(createComplaintBtn));
        button.click();
    }
    
    /**
     * Get complaint count from table
     */
    public int getComplaintCount() {
        waitForPageLoad();
        List<WebElement> rows = driver.findElements(complaintRows);
        return rows.size();
    }
    
    /**
     * Get all complaint IDs from table
     */
    public List<String> getComplaintIds() {
        List<WebElement> rows = driver.findElements(complaintRows);
        List<String> ids = new java.util.ArrayList<>();
        for (WebElement row : rows) {
            String id = row.findElement(By.xpath(".//td[1]")).getText();
            ids.add(id);
        }
        return ids;
    }
    
    /**
     * Click on specific complaint
     */
    public void clickComplaint(String complaintId) {
        By complaintLink = By.xpath("//table//tr[contains(., '" + complaintId + "')]");
        WebElement element = wait.until(ExpectedConditions.elementToBeClickable(complaintLink));
        element.click();
    }
    
    /**
     * Refresh dashboard
     */
    public void refreshDashboard() {
        WebElement button = wait.until(ExpectedConditions.elementToBeClickable(refreshButton));
        button.click();
        waitForPageLoad();
    }
    
    /**
     * Click filter button
     */
    public void clickFilterButton() {
        WebElement button = wait.until(ExpectedConditions.elementToBeClickable(filterButton));
        button.click();
    }
    
    /**
     * Logout
     */
    public void logout() {
        WebElement button = wait.until(ExpectedConditions.elementToBeClickable(logoutButton));
        button.click();
    }
    
    /**
     * Get user greeting text
     */
    public String getUserGreetingText() {
        return driver.findElement(userGreeting).getText();
    }
    
    /**
     * Check if dashboard is loaded
     */
    public boolean isDashboardLoaded() {
        try {
            return driver.findElement(dashboardContainer).isDisplayed();
        } catch (NoSuchElementException e) {
            return false;
        }
    }
    
    /**
     * Get summary card count
     */
    public int getSummaryCardCount() {
        List<WebElement> cards = driver.findElements(summaryCard);
        return cards.size();
    }
}
