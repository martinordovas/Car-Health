package com.carhealth.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class CarhealthApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(CarhealthApiApplication.class, args);
    }
}
