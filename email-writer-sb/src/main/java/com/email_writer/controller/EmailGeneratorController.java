package com.email_writer.controller;

import com.email_writer.model.EmailRequest;
import com.email_writer.model.EmailAnalysisResponse;
import com.email_writer.service.EmailGeneratorService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class EmailGeneratorController {
    private final EmailGeneratorService emailGeneratorService;

    @PostMapping("/generate")
    public ResponseEntity<String> generateEmail(@RequestBody EmailRequest emailRequest) {
        String response = emailGeneratorService.generateEmailReply(emailRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/analyze")
    public ResponseEntity<EmailAnalysisResponse> analyzeEmail(@RequestBody EmailRequest emailRequest) {
        EmailAnalysisResponse response = emailGeneratorService.analyzeEmail(emailRequest);
        return ResponseEntity.ok(response);
    }
}

