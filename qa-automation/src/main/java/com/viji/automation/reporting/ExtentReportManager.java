package com.viji.automation.reporting;

import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.reporter.ExtentSparkReporter;
import com.aventstack.extentreports.reporter.configuration.Theme;
import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Extent Report Configuration
 * Centralized report generation and configuration
 */
public class ExtentReportManager {
    private static ExtentReports extentReports;
    private static final String REPORT_PATH = "ExtentReports/";
    
    /**
     * Initialize Extent Reports
     */
    public static ExtentReports getInstance() {
        if (extentReports == null) {
            extentReports = new ExtentReports();
            attachReporter();
        }
        return extentReports;
    }
    
    /**
     * Attach Spark reporter
     */
    private static void attachReporter() {
        String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
        String reportName = "Selenium_Test_Report_" + timeStamp + ".html";
        String reportPath = REPORT_PATH + reportName;
        
        // Create directory if not exists
        new File(REPORT_PATH).mkdirs();
        
        ExtentSparkReporter sparkReporter = new ExtentSparkReporter(reportPath);
        
        // Configure report
        sparkReporter.config().setTheme(Theme.DARK);
        sparkReporter.config().setDocumentTitle("VIJI Automation Report");
        sparkReporter.config().setReportName("Selenium Test Results");
        sparkReporter.config().setTimeStampFormat("yyyy-MM-dd HH:mm:ss");
        
        // Add custom CSS
        sparkReporter.config().setCss(getCustomCSS());
        
        extentReports.attachReporter(sparkReporter);
        
        // Add system info
        extentReports.setSystemInfo("OS", System.getProperty("os.name"));
        extentReports.setSystemInfo("Java Version", System.getProperty("java.version"));
        extentReports.setSystemInfo("Environment", System.getProperty("environment", "QA"));
        extentReports.setSystemInfo("Browser", System.getProperty("browser", "Chrome"));
        extentReports.setSystemInfo("Headless", System.getProperty("headless", "true"));
    }
    
    /**
     * Get custom CSS
     */
    private static String getCustomCSS() {
        return ".pass { background-color: #28a745; color: white; }" +
               ".fail { background-color: #dc3545; color: white; }" +
               ".skip { background-color: #ffc107; color: white; }";
    }
    
    /**
     * Flush and close reports
     */
    public static void flushReports() {
        if (extentReports != null) {
            extentReports.flush();
        }
    }
}
