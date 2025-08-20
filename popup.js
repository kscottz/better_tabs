const copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

const closeTab = event => {
  event.stopPropagation();
  const tabData = event.currentTarget.dataset;
  const { tabId } = tabData
  console.log('tabData', tabData);
  const parsedTabId = parseInt(tabId, 10);
  chrome.tabs.remove(parsedTabId);
}

const switchToTab = (event) => {
  const tabData = event.currentTarget.dataset;
  const { windowId, pos } = tabData
  const parsedTabId = parseInt(pos, 10);
  const parseWindowId = parseInt(windowId, 10);
  chrome.tabs.highlight({tabs: parsedTabId, windowId: parseWindowId});
}

const openTextmarkr = () => {
  const date = (new Date()).toJSON();
  const title = encodeURIComponent(`Bookmarks ${date}`);
  const options = { url: `https://www.textmarkr.com/new?title=${title}` };
  chrome.tabs.create(options);
}

const makeTabElement = tab => {
  return (
    `<li>
        <div class="tablink"
        data-pos=${tab.index}
        data-window-id=${tab.windowId}
        data-tab-id=${tab.id}>
          <img src="${tab.favIconUrl}" />
          <div class="title">${tab.title}</div>
        </div>
        <div class="actions">
        <button class="close"
          data-pos=${tab.index}
          data-window-id=${tab.windowId}
          data-tab-id=${tab.id}>X</button>
        </div>
      </li>`
  );
};

let filterValue = '';

const attachListeners = () => {
  const closeButtons = document.querySelectorAll('#list button.close');
  closeButtons.forEach( b => { b.onclick = closeTab });

  const filter = document.getElementById('filter');
  filter.addEventListener('input', onUpdateFilter);

  const listElements = document.querySelectorAll('#list .tablink');
  listElements.forEach( b => { b.onclick = switchToTab });

  const copyToClipBtn = document.querySelector('#copy-to-clipboard');
  copyToClipBtn.addEventListener('click', copyLinksToClipboard);
}

const onUpdateFilter = function() {
  filterValue = (event.target.value || '').trim();
  populateList();
};

chrome.tabs.onRemoved.addListener(populateList);


const scrubList = function(inputString) {
    // This map holds the strings to find (keys) and what to replace them with (values).
    const replacementMap = {
	" - Open Robotics Discourse": "",
	" - Robot Operating System / Robot Operating System General":"",
	" - Gazebo / Gazebo PMC":"",
	" - Training & Education":"",
	" - Community Groups / Industrial robotics":"",
	" - Projects":"",
	" - Robot Operating System / Packaging and Release Management":"",
	" - Robot Operating System / Robot Operating System Announcements and News":"",
	" - TurtleBot":"",
	" - Robot Operating System / Robot Operating System PMC":"",
	" - ros-controls / ros-controls Announcements and News":"",
	" - Robot Operating System / Robot Operating System Ideas":"",
	" - OSRA Announcements and News":"",
	" - Infrastructure Project / Buildfarm":"",
	" - Open-RMF / Open-RMF Ideas":"",
	" - ROS / ROS Announcements and News":"",
	" - ROS / ROS Ideas":"",
	" - The Robot Report":"",
	" - YouTube":"(Video)",
	" on Vimeo":"(Video)",
	" | TechCrunch":"",
	" | LinkedIn":"",
	" | MIT Technology Review":"",
	" - IEEE Spectrum":""
    };

  let scrubbedString = inputString;

  // Loop through each key-value pair in the map.
    for (const key in replacementMap) {
	
    // Escape any special characters in the key to ensure it's treated as a literal string in the regex.
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create a regular expression to find all instances of the key.
    // The 'g' flag stands for "global," meaning it will replace all occurrences, not just the first one.
    const regex = new RegExp(escapedKey, 'g');
    
    // Perform the replacement.
    scrubbedString = scrubbedString.replace(regex, replacementMap[key]);
  }

  return scrubbedString;
};

function copyLinksToClipboard() {
    const queryInfo = { currentWindow: true };
    chrome.tabs.query(queryInfo, function(tabs){
	const getMarkdownLink = tab => `* [${tab.title}](${tab.url})`;
	const markdown = tabs.map(getMarkdownLink).join('\n');
	const cleaned = scrubList(markdown);  	
	// TO-DO: Use try catch to show feedback
	copyToClipboard(cleaned);
    });
}

function populateList(){
  const queryInfo = { currentWindow: true };

  chrome.tabs.query(queryInfo, function(tabs){
    const actualFilter = (filterValue || '').toLowerCase().trim();
    const filteredTabs = tabs.filter(tab => !filterValue || (tab.title || '').toLowerCase().match(actualFilter));

    let linkList = filteredTabs.map(makeTabElement).join('\n');
    linkList = `<ul>${linkList}</ul>`;
    document.getElementById('list').innerHTML = linkList;

    setTimeout( attachListeners, 0);

    const filter = document.getElementById('filter');
    filter.focus;
  });
}

document.addEventListener('DOMContentLoaded', function() {
  populateList();
});
