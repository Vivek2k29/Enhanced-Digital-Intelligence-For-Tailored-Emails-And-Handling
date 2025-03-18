import { useState } from 'react';
import { Container, Button, Typography, TextField, Box, FormControl, InputLabel, Select, MenuItem, CircularProgress, Paper, Grid, Chip } from '@mui/material';
import { Mail, Search, MessageSquare, ThumbsUp, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface EmailAnalysis {
  sender: string;
  subject: string;
  mainPoints: string[];
  tone: string;
  sentiment: string;
}

function App() {
  const [emailContent, setEmailContent] = useState('');
  const [tone, setTone] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post("http://localhost:8080/api/email/generate",
        {
          emailContent,
          tone
        });
      setGeneratedReply(typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
    } catch (error) {
      setError("Failed to generate email reply. Please try again");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeEmail = (content: string): EmailAnalysis => {
    // Split email into lines and remove empty lines
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Initialize variables
    let sender = '';
    let subject = '';
    let mainPoints: string[] = [];

    // Look for sender and subject in email headers
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].toLowerCase();
      if (line.startsWith('from:')) {
        sender = lines[i].substring(5).trim();
      } else if (line.startsWith('subject:')) {
        subject = lines[i].substring(8).trim();
      }
    }

    // If no explicit headers found, make educated guesses
    if (!sender && lines.length > 0) {
      // Look for common email patterns in the first few lines
      const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i;
      const namePattern = /([A-Z][a-z]+ [A-Z][a-z]+)/;
      
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const emailMatch = lines[i].match(emailPattern);
        const nameMatch = lines[i].match(namePattern);
        
        if (emailMatch) {
          sender = emailMatch[0];
          break;
        } else if (nameMatch) {
          sender = nameMatch[0];
          break;
        }
      }
      
      // If still no sender found, use first line
      if (!sender) {
        sender = lines[0].trim();
      }
    }

    // If no subject found, look for a likely subject line
    if (!subject && lines.length > 1) {
      // Look for a short line that doesn't start with common greetings
      const greetings = ['hi', 'hello', 'dear', 'good'];
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i].toLowerCase().trim();
        if (line.length > 10 && line.length < 100 && !greetings.some(g => line.startsWith(g))) {
          subject = lines[i].trim();
          break;
        }
      }
    }

    // Extract main points
    const bodyText = lines.join(' ');
    const sentences = bodyText.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);

    // Look for important sentences
    const importantMarkers = [
      'important',
      'urgent',
      'please',
      'need',
      'must',
      'required',
      'deadline',
      'asap',
      'attention',
      'critical'
    ];

    mainPoints = sentences
      .filter(sentence => {
        const lowerSentence = sentence.toLowerCase();
        return importantMarkers.some(marker => lowerSentence.includes(marker));
      })
      .map(point => point.trim())
      .slice(0, 3);

    // If no main points found, take the first few substantial sentences
    if (mainPoints.length === 0) {
      mainPoints = sentences
        .filter(s => s.length > 30)
        .slice(0, 2)
        .map(s => s.trim());
    }

    // Determine tone and sentiment
    const text = content.toLowerCase();
    
    // Tone analysis
    const formalIndicators = ['dear', 'sincerely', 'regards', 'kindly', 'pursuant', 'hereby', 'respectfully'];
    const casualIndicators = ['hey', 'hi', 'hello', 'thanks', 'cheers', 'bye', 'talk soon'];
    
    let formalCount = formalIndicators.filter(word => text.includes(word)).length;
    let casualCount = casualIndicators.filter(word => text.includes(word)).length;
    
    const tone = formalCount > casualCount ? 'Formal' : 'Casual';

    // Sentiment analysis
    const positiveWords = ['thank', 'appreciate', 'good', 'great', 'excellent', 'pleased', 'happy', 'glad', 'wonderful', 'looking forward'];
    const negativeWords = ['urgent', 'concern', 'issue', 'problem', 'sorry', 'apologize', 'unfortunately', 'regret', 'delay', 'difficult'];
    
    let positiveCount = positiveWords.filter(word => text.includes(word)).length;
    let negativeCount = negativeWords.filter(word => text.includes(word)).length;

    const sentiment = positiveCount > negativeCount ? 'Positive' : 
                     negativeCount > positiveCount ? 'Negative' : 'Neutral';

    return {
      sender: sender || 'Unknown Sender',
      subject: subject || 'No Subject',
      mainPoints: mainPoints.length > 0 ? mainPoints : ['No clear main points detected'],
      tone,
      sentiment
    };
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    setError('');
    try {
      const analysisResult = analyzeEmail(emailContent);
      setAnalysis(analysisResult);
    } catch (error) {
      setError("Failed to analyze email. Please try again");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Mail size={32} style={{ marginRight: '12px' }} />
          <Typography variant="h4" component="h1">
            Smart Email Assistant
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <MessageSquare size={20} style={{ marginRight: '8px' }} />
              Email Content
            </Typography>
            <TextField 
              fullWidth
              multiline
              rows={8}
              variant="outlined"
              placeholder="Paste your email content here..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAnalyze}
                disabled={!emailContent || analyzing}
                startIcon={analyzing ? <CircularProgress size={20} /> : <Search />}
                fullWidth
              >
                Analyze Email
              </Button>
              
              <FormControl fullWidth>
                <InputLabel>Tone</InputLabel>
                <Select
                  value={tone}
                  label="Tone"
                  onChange={(e) => setTone(e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="casual">Casual</MenuItem>
                  <MenuItem value="friendly">Friendly</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Button
              variant="contained"
              color="secondary"
              onClick={handleSubmit}
              disabled={!emailContent || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <MessageSquare />}
              fullWidth
            >
              Generate Reply
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            {analysis && (
              <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
                <Typography variant="h6" gutterBottom>Email Analysis</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">Sender</Typography>
                  <Typography>{analysis.sender}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">Subject</Typography>
                  <Typography>{analysis.subject}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">Main Points</Typography>
                  <ul style={{ paddingLeft: '20px' }}>
                    {analysis.mainPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    icon={<ThumbsUp size={16} />} 
                    label={`Tone: ${analysis.tone}`} 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<AlertCircle size={16} />} 
                    label={`Sentiment: ${analysis.sentiment}`} 
                    color="secondary" 
                    variant="outlined" 
                  />
                </Box>
              </Paper>
            )}

            {generatedReply && (
              <Box>
                <Typography variant="h6" gutterBottom>Generated Reply</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  variant="outlined"
                  value={generatedReply}
                  InputProps={{ readOnly: true }}
                />
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => navigator.clipboard.writeText(generatedReply)}
                >
                  Copy to Clipboard
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>
    </Container>
  );
}

export default App;