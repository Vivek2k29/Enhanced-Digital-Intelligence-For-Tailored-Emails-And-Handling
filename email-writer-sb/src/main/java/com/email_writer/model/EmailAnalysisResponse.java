package com.email_writer.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EmailAnalysisResponse {
    private String sender;
    private String subject;
    private String keyPoints;
    private String sentiment;
}
