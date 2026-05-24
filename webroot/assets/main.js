let callbackIdCounter = 0;

function runShell(command) {
    return new Promise((resolve) => {
        const callbackName = 'ksu_callback_' + Date.now() + '_' + (callbackIdCounter++);
        
        window[callbackName] = (errno, stdout, stderr) => {
            resolve(stdout ? stdout.trim() : "");
            delete window[callbackName];
        };

        try {
            if (typeof ksu !== 'undefined') {
                ksu.exec(command, "{}", callbackName);
            } else if (typeof apatch !== 'undefined') {
                apatch.exec(command, "{}", callbackName);
            } else {
                resolve("0"); 
                delete window[callbackName];
            }
        } catch (e) {
            resolve("");
            delete window[callbackName];
        }
    });
}

async function refreshUIState() {
    // Collect components references
    const otgBadge = document.getElementById("otg-badge");
    const otgSwitch = document.getElementById("otg-switch");
    
    const dt2wBadge = document.getElementById("dt2w-badge");
    const dt2wSwitch = document.getElementById("dt2w-switch");

    // Read real-time system properties configuration
    const otgProp = await runShell("getprop persist.sys.phh.transsion.usbotg");
    const dt2wProp = await runShell("getprop persist.sys.phh.transsion.dt2w");

    // Process USB OTG state mappings
    otgSwitch.disabled = false;
    if (otgProp === "1") {
        otgBadge.innerText = "Active";
        otgBadge.className = "badge badge-enabled";
        otgSwitch.checked = true;
    } else {
        otgBadge.innerText = "Off";
        otgBadge.className = "badge badge-disabled";
        otgSwitch.checked = false;
    }

    // Process DT2W state mappings
    dt2wSwitch.disabled = false;
    if (dt2wProp === "1") {
        dt2wBadge.innerText = "Active";
        dt2wBadge.className = "badge badge-enabled";
        dt2wSwitch.checked = true;
    } else {
        dt2wBadge.innerText = "Off";
        dt2wBadge.className = "badge badge-disabled";
        dt2wSwitch.checked = false;
    }
}

async function handleSwitchToggle(propName, switchElement, enabledValue, disabledValue) {
    // Temporarily freeze switch modifications to prevent accidental double triggering
    document.getElementById("otg-switch").disabled = true;
    document.getElementById("dt2w-switch").disabled = true;

    const targetValue = switchElement.checked ? enabledValue : disabledValue;
    await runShell(`setprop ${propName} ${targetValue}`);
    
    // Refresh properties UI representation state
    setTimeout(refreshUIState, 200);
}

document.addEventListener("DOMContentLoaded", () => {
    const otgCard = document.getElementById("otg-card");
    const otgSwitch = document.getElementById("otg-switch");
    const dt2wCard = document.getElementById("dt2w-card");
    const dt2wSwitch = document.getElementById("dt2w-switch");

    // Clicking anywhere on the entire row card triggers the sliding toggle action
    otgCard.addEventListener("click", (e) => {
        if (otgSwitch.disabled) return;
        if (e.target !== otgSwitch) {
            otgSwitch.checked = !otgSwitch.checked;
        }
        handleSwitchToggle("persist.sys.phh.transsion.usbotg", otgSwitch, "1", "0");
    });

    dt2wCard.addEventListener("click", (e) => {
        if (dt2wSwitch.disabled) return;
        if (e.target !== dt2wSwitch) {
            dt2wSwitch.checked = !dt2wSwitch.checked;
        }
        handleSwitchToggle("persist.sys.phh.transsion.dt2w", dt2wSwitch, "1", "2");
    });

    setTimeout(refreshUIState, 100);
});
