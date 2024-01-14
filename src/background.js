import { Document, Packer, Paragraph, ImageRun, TextRun } from 'docx';

let storedScreenshots = [];

const popupHtml = `
<div id="screenshotPopup" style="position: fixed; top: 10px; right: 10px; z-index: 1000; background-color: #f8f8f8; border: 1px solid #ddd; padding: 10px; box-shadow: 0px 0px 5px #ccc;">
    Screenshot taken and stored!
</div>
`;


chrome.commands.onCommand.addListener(function(command) {
    if (command === "take_screenshot") {
        takeScreenshot();
    } else if (command === "manage_screenshots") {
        manageScreenshots();
    }
});

function takeScreenshot() {
    chrome.tabs.captureVisibleTab(null, {}, function(imageUri) {
        if (chrome.runtime.lastError) {
            console.error('Error taking screenshot:', chrome.runtime.lastError.message);
            return;
        }
        console.log("Screenshot taken:", imageUri);
        
        storedScreenshots.push(imageUri);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTabId = tabs[0].id;

            // Inject the popup HTML into the current tab
            chrome.scripting.executeScript({
                target: { tabId: currentTabId },
                function: showPopup
            });
        });
    });
}

function showPopup() {
    const popupHtml = `
    <div id="screenshotPopup" style="position: fixed; top: 10px; right: 10px; z-index: 1000; background-color: #f8f8f8; border: 1px solid #ddd; padding: 10px; box-shadow: 0px 0px 5px #ccc;">
        Screenshot taken and stored!
    </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = popupHtml;
    document.body.appendChild(div);

    setTimeout(() => {
        div.remove();
    }, 1000);
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
