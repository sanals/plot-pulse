package com.company.project.config;

import java.util.Properties;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * Email Configuration
 * 
 * Configures the JavaMailSender for sending emails from the application.
 * This includes SMTP settings and authentication details.
 */
@Configuration
public class EmailConfig {

    /**
     * Creates and configures a JavaMailSender for sending emails
     * 
     * Sets up SMTP configuration including:
     * - Host and port for Gmail SMTP
     * - Authentication credentials
     * - TLS/SSL settings
     * 
     * Note: In production, email credentials should be stored in environment
     * variables
     * or configuration properties rather than hardcoded.
     * 
     * @return Configured JavaMailSender
     */
    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername("your-email@gmail.com"); // configure in properties
        mailSender.setPassword("your-app-password"); // configure in properties

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "true");

        return mailSender;
    }
}