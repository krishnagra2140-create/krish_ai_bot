export default async (req) => {
    try {
        const { messages } = await req.json();

        // Convert our chat messages into Gemini format
        const contents = messages
            .filter(message => message.role !== "system")
            .map(message => ({
                role: message.role === "assistant" ? "model" : "user",
                parts: [
                    {
                        text: message.content
                    }
                ]
            }));

        // FIX 1: Updated the URL to the real model (gemini-1.5-flash)
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // FIX 2: Make sure your Netlify environment variable is named exactly this!
                    "x-goog-api-key": process.env.GEMINI_API_KEY 
                },
                body: JSON.stringify({
                    contents: contents
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(data);

            return new Response(
                JSON.stringify({
                    error: data.error?.message || "Gemini API error"
                }),
                {
                    status: response.status,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        const answer =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn't generate a response.";

        return new Response(
            // FIX 3: Changed this from 'answer' to 'reply' so your script.js can read it
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
        console.error(error);

        return new Response(
            JSON.stringify({
                error: "Something went wrong."
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
};s
