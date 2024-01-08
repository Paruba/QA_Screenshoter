import { Document, Packer, Paragraph, ImageRun, TextRun } from 'docx';

let storedScreenshots = []; // Array to store screenshots

chrome.runtime.onInstalled.addListener(function() {
    chrome.commands.onCommand.addListener(function(command) {
        if (command === "take_screenshot") {
            takeScreenshot();
        } else if (command === "manage_screenshots") {
            manageScreenshots();
        }
    });
});

function takeScreenshot() {
    chrome.tabs.captureVisibleTab(null, {}, function(imageUri) {
        if (chrome.runtime.lastError) {
            console.error('Error taking screenshot:', chrome.runtime.lastError.message);
            return;
        }
        console.log("Screenshot taken:", imageUri);
        storedScreenshots.push(imageUri); // Store screenshot in memory
    });
}

function manageScreenshots() {
    if (storedScreenshots.length === 0) {
        console.log("No screenshots to manage");
        return;
    }
    
    createAndDownloadWordDocument(storedScreenshots);
    storedScreenshots = []; // Clear screenshots from memory
}

async function createAndDownloadWordDocument(screenshots) {
    const doc = new Document({
        sections: [{
            properties: {},
            children: screenshots.map(screenshot => new Paragraph({
                children: [
                    new ImageRun({
                        data: screenshot,
                        transformation: {
                            width: 500,
                            height: 300,
                        },
                    }),
                ],
            })),
        }],
    });

    try {
        const blob = await Packer.toBlob(doc);
        console.log("Blob created:", blob);

        // Convert blob to data URL
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function() {
            const base64data = reader.result;

            chrome.downloads.download({
                url: base64data,
                filename: "screenshots.docx"
            });

            console.log("Document created and download initiated.");
        };
    } catch (error) {
        console.error("Error in createAndDownloadWordDocument:", error);
    }
}

console.log('Background service worker loaded and running');
