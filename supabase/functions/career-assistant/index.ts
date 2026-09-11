const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // Request body
    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({
          error: "Message is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // OpenAI API key
    const openaiApiKey = Deno.env.get("openai_api_key");

    if (!openaiApiKey) {
      throw new Error("openai_api_key secret topilmadi");
    }

    // OpenAI API
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5.6",
          input: [
            {
              role: "system",
              content:
                "Sen AgentHire AI platformasining professional career assistantisan. Foydalanuvchilarga ish qidirish, CV, ishga topshirish, interview va career bo‘yicha qisqa, aniq va foydali yordam ber. Foydalanuvchi o‘zbek tilida yozsa, o‘zbek tilida javob ber.",
            },
            {
              role: "user",
              content: message,
            },
          ],
        }),
      },
    );

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("OpenAI error:", openaiData);

      throw new Error(
        openaiData?.error?.message ?? "OpenAI API xatosi",
      );
    }

    const aiMessage = openaiData.output_text ??
      "AI javob qaytarmadi.";

    return new Response(
      JSON.stringify({
        success: true,
        message: aiMessage,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Career Assistant error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
