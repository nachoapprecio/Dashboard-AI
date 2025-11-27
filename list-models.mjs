import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyAGy1_u2qRIxLMW5a2K2RDrbFtv2XwQ6D0');

try {
  const models = await genAI.listModels();
  console.log('\n=== MODELOS DISPONIBLES ===\n');
  
  models.forEach(model => {
    const supportsGenerate = model.supportedGenerationMethods?.includes('generateContent');
    if (supportsGenerate) {
      console.log(`✓ ${model.name}`);
    }
  });
  
  console.log('\n=========================\n');
} catch (error) {
  console.error('Error:', error.message);
}
