package com.company.project.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Component;

/**
 * Logs the server port on startup for debugging
 */
@Component
public class ServerPortLogger implements ApplicationListener<ContextRefreshedEvent> {

    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        ApplicationContext context = event.getApplicationContext();
        if (context instanceof ServletWebServerApplicationContext) {
            ServletWebServerApplicationContext webContext = (ServletWebServerApplicationContext) context;
            int port = webContext.getWebServer().getPort();
            String address = webContext.getWebServer().getAddress() != null 
                ? webContext.getWebServer().getAddress().getHostAddress() 
                : "0.0.0.0";
            System.out.println("═══════════════════════════════════════════════════════");
            System.out.println("🚀 Server started successfully!");
            System.out.println("   Listening on: " + address + ":" + port);
            System.out.println("   Context path: /api/v1");
            System.out.println("   Full URL: http://" + address + ":" + port + "/api/v1");
            System.out.println("═══════════════════════════════════════════════════════");
        }
    }
}

