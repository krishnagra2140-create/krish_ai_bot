export default async (req) => {
    try {
        // Only allow POST requests
        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({ error: "Method not allowed" }),
                {
                    status: 405,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // Check API key (Changed to GROQ_API_KEY)
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            console.error("GROQ_API_KEY is missing");

            return new Response(
                JSON.stringify({
                    error: "GROQ_API_KEY is not configured in Netlify."
                }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // Read request body
        const body = await req.json();
        const messages = body.messages;

        if (!Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({
                    error: "No messages were provided."
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // Convert messages to Groq API format
        const formattedMessages = messages
            .filter(message => message.role === "user" || message.role === "assistant")
            .map(message => ({
                role: message.role,
                content: message.content
            }));

        // Send request to Groq (Updated URL and body format)
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-120b",
                    messages: formattedMessages
                })
            }
        );

        const data = await response.json();

        // Handle Groq API errors
        if (!response.ok) {
            console.error("Groq API error:", data);

            return new Response(
                JSON.stringify({
                    error:
                        data?.error?.message ||
                        data?.message ||
                        "Groq API request failed."
                }),
                {
                    status: response.status,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // Get Groq's text response (Updated to OpenAI format)
        const answer = data.choices?.[0]?.message?.content;

        if (!answer) {
            console.error("Unexpected Groq response:", data);

            return new Response(
                JSON.stringify({
                    error: "Groq returned an empty response."
                }),
                {
                    status: 502,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // Return response to your frontend
        return new Response(
            JSON.stringify({
                reply: answer
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {
        console.error("Chat function error:", error);

        return new Response(
            JSON.stringify({
                error: "Something went wrong while contacting Groq."
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
};
