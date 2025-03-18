package com.email_writer.service;

import com.email_writer.model.EmailRequest;
import com.email_writer.model.EmailAnalysisResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class EmailGeneratorService {
    private final WebClient webClient;
    private final TranslationService translationService;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;
    @Value("${gemini.api.key}")
    private String getGeminiApiKey;

    public EmailGeneratorService(WebClient.Builder webClientBuilder, TranslationService translationService) {
        this.webClient = webClientBuilder.build();
        this.translationService = translationService;
    }

    public String generateEmailReply(EmailRequest emailRequest) {
        String prompt = buildPrompt(emailRequest);
        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );
        String response = webClient.post()
                .uri(geminiApiUrl + getGeminiApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        String reply = extractResponseContent(response);
        return translationService.translateText(reply, emailRequest.getLanguage());
    }

    public EmailAnalysisResponse analyzeEmail(EmailRequest emailRequest) {
        String emailContent = emailRequest.getEmailContent();
        String sender = extractSender(emailContent);
        String subject = extractSubject(emailContent);
        String keyPoints = extractKeyPoints(emailContent);
        String sentiment = analyzeSentiment(emailContent);

        EmailAnalysisResponse response = new EmailAnalysisResponse(sender, subject, keyPoints, sentiment);

        // ✅ Correct method call
        return translationService.translateAnalysis(response, emailRequest.getLanguage());
    }

    private String extractSender(String emailContent) {
        return "Extracted Sender Name";
    }

    private String extractSubject(String emailContent) {
        return "Extracted Subject";
    }

    private String extractKeyPoints(String emailContent) {
        return "Key Points extracted from email";
    }

    private String analyzeSentiment(String emailContent) {
        return "Positive/Negative/Neutral Sentiment";
    }

    private String buildPrompt(EmailRequest emailRequest) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Generate a professional email reply for the following email content. Please don't generate a subject line. ");
        if (emailRequest.getTone() != null && !emailRequest.getTone().isEmpty()) {
            prompt.append("Use a ").append(emailRequest.getTone()).append(" tone.");
        }
        prompt.append("\nOriginal email: \n").append(emailRequest.getEmailContent());
        return prompt.toString();
    }

    private String extractResponseContent(String response) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(response);
            return rootNode.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();
        } catch (Exception e) {
            return "Error processing request: " + e.getMessage();
        }
    }
}
