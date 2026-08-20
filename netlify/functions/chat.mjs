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

        // Check API key
        const apiKey = process.env.XAI_API_KEY;

        if (!apiKey) {
            console.error("XAI_API_KEY is missing");

            return new Response(
                JSON.stringify({
                    error: "XAI_API_KEY is not configured in Netlify."
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

        // Convert messages to xAI Responses API format
        const input = messages
            .filter(message => message.role === "user" || message.role === "assistant")
            .map(message => ({
                role: message.role,
                content: message.content
            }));

        // Send request to Grok
        const response = await fetch(
            "https://api.x.ai/v1/responses",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "grok-4.5",
                    input: input
                })
            }
        );

        const data = await response.json();

        // Handle Grok API errors
        if (!response.ok) {
            console.error("xAI API error:", data);

            return new Response(
                JSON.stringify({
                    error:
                        data?.error?.message ||
                        data?.message ||
                        "Grok API request failed."
                }),
                {
                    status: response.status,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        // Get Grok's text response
        const answer =
            data.output_text ||
            data.output
                ?.filter(item => item.type === "message")
                ?.flatMap(item => item.content || [])
                ?.find(content => content.type === "output_text")
                ?.text;

        if (!answer) {
            console.error("Unexpected xAI response:", data);

            return new Response(
                JSON.stringify({
                    error: "Grok returned an empty response."
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
                error: "Something went wrong while contacting Grok."
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
