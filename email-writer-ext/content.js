function getEmailContent() {
    const selectors = ['.h7', '.a3s.aiL', '.gmail_quote', '[role="presentation"]'];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerText.trim();
        }
    }
    return "";
}

const findComposeToolbar = () => {
    const selectors = ['.btC', '.aDh', '[role="toolbar"]', '.gU.Up'];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            return toolbar;
        }
    }
    return null;
};

function createAIButton() {
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply-button';
    button.style.marginRight = '8px';
    button.innerHTML = 'AI Reply';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    return button;
}

const injectButton = () => {
    if (document.querySelector('.ai-reply-button')) return; // Prevent duplicate buttons

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Toolbar Not Found");
        return;
    }

    console.log("Toolbar Found");
    const button = createAIButton();

    button.addEventListener('click', async () => {
        try {
            button.innerHTML = 'Generating...';
            button.disabled = true;

            const emailContent = getEmailContent();
            console.log("Extracted Email Content: ", emailContent);

            const response = await fetch('http://localhost:8080/api/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailContent, tone: "professional" })
            });

            if (!response.ok) throw new Error('API Request Failed.');

            const responseText = await response.text();
            let generatedReply;

            try {
                const data = JSON.parse(responseText);
                generatedReply = data.reply; // JSON response
            } catch {
                generatedReply = responseText; // Plain text response
            }

            const composeBox = document.querySelector('[role="textbox"][contenteditable="true"]');
            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
            } else {
                console.error("Failed to insert generated reply");
            }

        }  finally {
            button.innerHTML = "AI Reply";
            button.disabled = false;
        }
    });

    toolbar.insertBefore(button, toolbar.firstChild);
};

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC,[role="dialog"]') || node.querySelector('.aDh, .btC,[role="dialog"]'))
        );
        if (hasComposeElements) {
            console.log("Compose window detected.");
            injectButton();
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
