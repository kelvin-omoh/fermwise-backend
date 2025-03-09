/**
 * AI Analyzers for FermWise Monitoring System
 * 
 * These analyzers use Google's Gemini AI model with LangChain for RAG to provide insights.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
// Use direct imports instead of LangChain packages that are causing issues
// We'll create our own simplified versions of the needed functionality
import { CropImageData, CropHealthAnalysisResult } from './types';
import fetch from 'node-fetch';

// Initialize Gemini AI
const initGeminiAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    return new GoogleGenerativeAI(apiKey);
};

// Simple prompt template implementation
interface PromptTemplateOptions {
    template: string;
}

class SimplePromptTemplate {
    private template: string;

    constructor(options: PromptTemplateOptions) {
        this.template = options.template;
    }

    format(values: Record<string, any>): string {
        let result = this.template;
        for (const [key, value] of Object.entries(values)) {
            result = result.replace(new RegExp(`{${key}}`, 'g'), value);
        }
        return result;
    }

    async invoke(values: Record<string, any>): Promise<string> {
        return this.format(values);
    }

    pipe<T>(next: { invoke: (input: string) => Promise<T> }): { invoke: (input: Record<string, any>) => Promise<T> } {
        return {
            invoke: async (input: Record<string, any>) => {
                const formattedPrompt = await this.invoke(input);
                return next.invoke(formattedPrompt);
            }
        };
    }
}

// Simple Gemini model wrapper
class SimpleGeminiModel {
    private model: GoogleGenerativeAI;
    private modelName: string;

    constructor(apiKey: string, modelName: string = "gemini-1.5-flash") {
        this.model = new GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
    }

    async invoke(input: string | { prompt?: string, image?: any[] }): Promise<string> {
        try {
            const geminiModel = this.model.getGenerativeModel({ model: this.modelName });

            // Handle different input types
            if (typeof input === 'string') {
                const result = await geminiModel.generateContent(input);
                return result.response.text();
            } else if (input.image && input.image.length > 0) {
                // For Cloudinary URLs, we need to fetch the image first
                const imageUrl = input.image[0].image_url;

                try {
                    // Fetch the image and convert to base64
                    const response = await fetch(imageUrl);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch image: ${response.statusText}`);
                    }

                    const arrayBuffer = await response.arrayBuffer();
                    const base64Image = Buffer.from(arrayBuffer).toString('base64');

                    // Create a content part with the base64 image
                    const result = await geminiModel.generateContent({
                        contents: [
                            {
                                role: "user",
                                parts: [
                                    { text: input.prompt || "" },
                                    {
                                        inlineData: {
                                            mimeType: "image/jpeg",
                                            data: base64Image
                                        }
                                    }
                                ]
                            }
                        ]
                    });

                    return result.response.text();
                } catch (imageError) {
                    console.error("Error processing image URL:", imageError);
                    // Fallback to text-only if image processing fails
                    const textResult = await geminiModel.generateContent(
                        `[Image analysis failed] ${input.prompt || ""}`
                    );
                    return textResult.response.text();
                }
            } else {
                const result = await geminiModel.generateContent(input.prompt || "");
                return result.response.text();
            }
        } catch (error) {
            console.error("Error invoking Gemini model:", error);
            return "Error analyzing image. Please try again.";
        }
    }

    pipe<T>(next: { invoke: (input: string) => Promise<T> }): { invoke: (input: any) => Promise<T> } {
        return {
            invoke: async (input: any) => {
                const result = await this.invoke(input);
                return next.invoke(result);
            }
        };
    }
}

// Simple output parser
class SimpleOutputParser {
    async invoke(input: string): Promise<string> {
        return input;
    }

    pipe<T>(next: { invoke: (input: string) => Promise<T> }): { invoke: (input: string) => Promise<T> } {
        return {
            invoke: async (input: string) => {
                const result = await this.invoke(input);
                return next.invoke(result);
            }
        };
    }
}

/**
 * Crop disease knowledge base for RAG
 */
const cropDiseaseKnowledgeBase = [
    {
        disease: "Late Blight",
        crops: ["Potato", "Tomato"],
        symptoms: "Dark, water-soaked lesions on leaves that quickly enlarge and turn brown with a slight yellow border. White fungal growth may be visible on the underside of leaves in humid conditions.",
        causes: "Caused by the oomycete pathogen Phytophthora infestans. Favored by cool, wet weather with high humidity.",
        management: "Use resistant varieties, apply fungicides preventatively, ensure good air circulation, avoid overhead irrigation, remove and destroy infected plants."
    },
    {
        disease: "Powdery Mildew",
        crops: ["Cucumber", "Squash", "Melon", "Grape", "Apple"],
        symptoms: "White powdery spots on leaves and stems that eventually cover the entire surface. Leaves may yellow, curl, or die prematurely.",
        causes: "Caused by various species of fungi. Favored by warm, dry conditions with high humidity, especially at night.",
        management: "Use resistant varieties, apply fungicides, ensure proper spacing for air circulation, avoid overhead irrigation."
    },
    {
        disease: "Rust",
        crops: ["Wheat", "Corn", "Bean", "Coffee"],
        symptoms: "Small, round, rusty-orange to reddish-brown pustules on leaves, stems, and sometimes fruits. Severe infections cause yellowing and premature leaf drop.",
        causes: "Caused by various species of fungi in the order Pucciniales. Favored by warm, humid conditions with extended leaf wetness.",
        management: "Use resistant varieties, apply fungicides, practice crop rotation, remove alternate hosts if applicable."
    },
    {
        disease: "Bacterial Leaf Spot",
        crops: ["Pepper", "Tomato", "Lettuce"],
        symptoms: "Small, dark, water-soaked spots on leaves that enlarge and turn brown with a yellow halo. In severe cases, leaves may drop prematurely.",
        causes: "Caused by various species of bacteria, including Xanthomonas and Pseudomonas. Spread by water splash, contaminated tools, and seeds.",
        management: "Use disease-free seeds and transplants, apply copper-based bactericides, avoid overhead irrigation, practice crop rotation."
    },
    {
        disease: "Fusarium Wilt",
        crops: ["Tomato", "Banana", "Cotton", "Melon"],
        symptoms: "Yellowing and wilting of leaves, often starting on one side of the plant. Brown discoloration of vascular tissue when stem is cut lengthwise.",
        causes: "Caused by soil-borne fungi in the Fusarium genus. Can persist in soil for many years.",
        management: "Use resistant varieties, practice crop rotation, solarize soil, use disease-free transplants, maintain optimal growing conditions."
    }
];

/**
 * Prompt template for crop health analysis
 */
const cropHealthAnalysisPrompt = new SimplePromptTemplate({
    template: `
You are an agricultural expert AI assistant helping farmers analyze crop health from images.

CONTEXT:
The farmer has uploaded an image of their crops for analysis. They want to know if there are any signs of disease, pests, or other issues affecting their crops.

CROP DISEASE KNOWLEDGE:
{knowledge_base}

INSTRUCTIONS:
1. Analyze the image carefully for any signs of disease, pests, nutrient deficiencies, or other issues.
2. If you identify any problems, provide a clear explanation of what you see and what it might indicate.
3. Provide practical advice that a farmer can implement.
4. Use simple, clear language that a farmer would understand.
5. If you're uncertain about anything, acknowledge your uncertainty rather than making definitive claims.
6. Format your response in a structured way with clear sections.

YOUR ANALYSIS:
`
});

/**
 * Analyzes crop health from an image using Gemini AI
 */
export const analyzeCropHealth = async (
    cropImageData: CropImageData
): Promise<CropHealthAnalysisResult> => {
    try {
        // Initialize Gemini AI
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not defined in environment variables");
        }

        // Create simple model
        const model = new SimpleGeminiModel(apiKey);

        // Prepare knowledge base as string
        const knowledgeBaseStr = cropDiseaseKnowledgeBase
            .map(entry => `
Disease: ${entry.disease}
Affected Crops: ${entry.crops.join(", ")}
Symptoms: ${entry.symptoms}
Causes: ${entry.causes}
Management: ${entry.management}
      `).join("\n");

        // Format the prompt with the knowledge base
        const prompt = cropHealthAnalysisPrompt.format({
            knowledge_base: knowledgeBaseStr
        });

        // Use the Cloudinary URL directly
        const imageUrl = cropImageData.image_url;

        // Call the model directly with the prompt and image
        const result = await model.invoke({
            prompt: prompt,
            image: [{
                type: "image_url",
                image_url: imageUrl
            }]
        });

        // Parse the result to extract key information
        const hasDisease = result.toLowerCase().includes("disease") ||
            result.toLowerCase().includes("pest") ||
            result.toLowerCase().includes("deficiency");

        // Determine status based on analysis
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        if (hasDisease) {
            status = result.toLowerCase().includes("severe") ? 'critical' : 'warning';
        }

        // Extract a concise message from the result
        let message = "No issues detected in your crops.";
        let suggestion = "Continue with your current management practices.";

        if (hasDisease) {
            // Extract the first sentence that mentions a disease or issue
            const sentences = result.split(/[.!?]/).filter((s: string) => s.trim().length > 0);
            const issueSentence = sentences.find((s: string) =>
                s.toLowerCase().includes("disease") ||
                s.toLowerCase().includes("pest") ||
                s.toLowerCase().includes("deficiency")
            );

            if (issueSentence) {
                message = issueSentence.trim() + ".";
            } else {
                message = "Potential issues detected in your crops.";
            }

            // Extract suggestion
            const suggestionSentence = sentences.find((s: string) =>
                s.toLowerCase().includes("recommend") ||
                s.toLowerCase().includes("suggest") ||
                s.toLowerCase().includes("should") ||
                (s.toLowerCase().includes("can") && s.toLowerCase().includes("treat"))
            );

            if (suggestionSentence) {
                suggestion = suggestionSentence.trim() + ".";
            }
        }

        return {
            timestamp: new Date(),
            status,
            message,
            suggestion,
            image_url: cropImageData.image_url,
            detected_issues: hasDisease ? [message] : [],
            confidence_score: hasDisease ? 0.8 : 0.9,
            ai_analysis_details: {
                full_analysis: result,
                crop_type: cropImageData.crop_type || "Unknown"
            }
        };
    } catch (error) {
        console.error("Error analyzing crop health:", error);
        return {
            timestamp: new Date(),
            status: 'warning',
            message: "Failed to analyze crop health image.",
            suggestion: "Please try again or contact support if the issue persists.",
            image_url: cropImageData.image_url
        };
    }
}; 