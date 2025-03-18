package com.email_writer.service;

import com.email_writer.model.EmailAnalysisResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Value;

@Service
public class TranslationService {
    private final WebClient webClient;

    @Value("${google.translate.api.url}")
    private String translateApiUrl;
    @Value("${google.translate.api.key}")
    private String translateApiKey;

    public TranslationService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public String translateText(String text, String targetLanguage) {
        if (targetLanguage == null || targetLanguage.equalsIgnoreCase("english")) {
            return text;  // No translation needed
        }

        try {
            String response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path(translateApiUrl)
                            .queryParam("key", translateApiKey)
                            .build())
                    .header("Content-Type", "application/json")
                    .bodyValue("{\"q\":\"" + text + "\",\"target\":\"" + targetLanguage + "\"}")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return extractTranslatedText(response);
        } catch (Exception e) {
            return "Translation error: " + e.getMessage();
        }
    }

    private String extractTranslatedText(String response) {
        return "Translated text from API"; // Placeholder
    }

    public EmailAnalysisResponse translateAnalysis(EmailAnalysisResponse response, String targetLanguage) {
        if (response == null || targetLanguage == null) {
            return response;
        }

        response.setSender(translateText(response.getSender(), targetLanguage));
        response.setSubject(translateText(response.getSubject(), targetLanguage));
        response.setKeyPoints(translateText(response.getKeyPoints(), targetLanguage));
        response.setSentiment(translateText(response.getSentiment(), targetLanguage));

        return response;
    }
}
