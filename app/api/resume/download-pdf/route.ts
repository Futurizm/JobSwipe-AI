import { type NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

// Импортируем функции из вашего основного файла
// Убедитесь, что путь к файлу правильный относительно download-pdf.ts
import { parseUserInputWithAI, generateResumeHTML } from "../generate-pdf/route"; // Путь к вашему основному файлу



export async function POST(request: NextRequest) {
  try {
    const { userInput } = await request.json();

    if (!userInput || userInput.trim().length < 10) {
      return NextResponse.json({ error: "Недостаточно информации для создания резюме" }, { status: 400 });
    }

    console.log("Parsing user input for PDF...");

    // Parse user input with AI
    const resumeData = await parseUserInputWithAI(userInput);

    console.log("Generating HTML for PDF...");

    // Generate HTML template for PDF
    const htmlContent = generateResumeHTML(resumeData, userInput);

    console.log("Generating PDF...");

    // Launch headless browser
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set HTML content
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "10mm",
        right: "10mm",
      },
    });

    // Close browser
    await browser.close();

    console.log("PDF generated successfully");

    // Encode filename for Content-Disposition
    const encodedFilename = encodeURIComponent(resumeData.fullName.replace(/\s+/g, "_")) + "_resume.pdf";
    const safeFilename = resumeData.fullName.replace(/[^a-zA-Z0-9\s]/g, "_").replace(/\s+/g, "_") + "_resume.pdf";

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in generate-pdf route:", error);
    return NextResponse.json(
      { error: "Не удалось создать PDF: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    );
  }
}