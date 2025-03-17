async function fetchJSONData(filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Unable to fetch data:", error);
  }
}

function createElement(elementType, className, innerText) {
  const element = document.createElement(elementType);
  if (className) element.className = className;
  if (innerText) element.innerText = innerText;
  return element;
}

function createImage(src, className, id) {
  const image = document.createElement("img");
  if (className) image.className = className;
  if (id) {
    image.id = id;
    image.setAttribute("data-id", id);
  }
  image.src = src;
  return image;
}

function* genId() {
  let id = 0;
  while (true) {
    yield `mem_${id++}`;
  }
}

let id = genId();

function renderGroupedMemories(groupedMemories, memsDiv) {
  groupedMemories.forEach(({ date, memories }) => {
    const dateWrapper = createElement("div", "year");
    dateWrapper.setAttribute("data-year", date);
    memsDiv.appendChild(dateWrapper);

    memories.forEach(({ text, image }) => {
      const memDiv = createElement("div", "memory");
      const textSpan = createElement("span", "", text);
      memDiv.setAttribute("data-image", image);
      memDiv.setAttribute("data-id", id.next().value);

      memDiv.appendChild(textSpan);
      dateWrapper.appendChild(memDiv);
    });
  });
}

function debugVisibleArea() {
  const body = document.querySelector("body");
  const scrollDiv = createElement("div", "scroll");
  const scrollPos = createElement("div", "scroll-pos");
  const scrollImg = createElement("img", "scroll-img");
  body.appendChild(scrollDiv);
  scrollDiv.appendChild(scrollPos);
  scrollDiv.appendChild(scrollImg);
}

const elementPosition = (el) => {
  let position = "";
  const { top, bottom } = el.getBoundingClientRect();
  const { innerHeight } = window;

  const viewport25 = innerHeight * 0.25;
  const viewport50 = innerHeight * 0.5;

  const topStart = 0;
  const topEnd = viewport25;
  const middleStart = topEnd;
  const middleEnd = viewport25 + viewport50;
  const bottomStart = middleEnd;
  const bottomEnd = innerHeight;

  if (top > bottomEnd && bottom > bottomStart) {
    position = "bottom";
  } else if (top > middleStart && bottom > middleEnd) {
    position = "middle";
  } else {
    position = "top";
  }

  return position;
};

const showElement = (el) => {
  let show = false;
  const { top: elTop, bottom: elBottom } = el.getBoundingClientRect();
  const { innerHeight } = window;

  const viewport25 = innerHeight * 0.25;
  const viewport50 = innerHeight * 0.5;

  const topStart = 0;
  const topEnd = viewport25;
  const middleStart = topEnd;
  const middleEnd = viewport25 + viewport50;
  const bottomStart = middleEnd;
  const bottomEnd = innerHeight;

  if (elTop > bottomEnd && elBottom > bottomStart) {
    show = true;
  } else if (elTop > middleStart && elBottom > middleEnd) {
    show = true;
  } else {
    show = false;
  }

  return show;
};

const isInViewport = (el) => {
  const { top, bottom } = el.getBoundingClientRect();
  const { innerHeight } = window;
  // get 25% from top of viewport
  const viewAreaTop = innerHeight * 0.25;
  const viewAreaBottom = viewAreaTop + innerHeight / 2;

  // check if element is between viewAreaTop and viewAreaBottom
  return top < viewAreaBottom && bottom > viewAreaTop;
};

function renderImages(memoryElements, images) {
  memoryElements.forEach((memory) => {
    const imageSrc = memory.getAttribute("data-image");
    const imageID = memory.getAttribute("data-id");

    const imageContainer = createElement("div", "image-container");
    imageContainer.setAttribute("data-id", imageID);

    const image = createImage(`./img/${imageSrc}`, "image");

    imageContainer.appendChild(image);
    images.append(imageContainer);
  });
}

function setupScrollListener(memoryElements, images, h1) {
  window.addEventListener("scroll", () => {
    const firstImageWrapper = images.querySelector("[data-id='firstImage']");

    if (isInViewport(h1)) {
      firstImageWrapper.classList.add("visible");
    } else {
      firstImageWrapper.classList.remove("visible");
    }

    memoryElements.forEach((memory) => {
      const imageID = memory.getAttribute("data-id");

      // if (isInViewport(memory)) {
      //   console.log(imageID, "in viewport");
      // }

      if (isInViewport(memory)) {
        memory.classList.add("active");
        console.log(imageID, "in viewport");
        const imageWrapper = document.querySelector(
          `.image-container[data-id="${imageID}"]`
        );
        if (imageWrapper) {
          imageWrapper.classList.add("visible");
        }
      } else {
        memory.classList.remove("active");
        const imageWrapper = document.querySelector(
          `.image-container[data-id="${imageID}"]`
        );
        if (imageWrapper) {
          imageWrapper.classList.remove("visible");
        }
      }
    });
  });
}

async function initialize() {
  // debugVisibleArea();

  // get data
  const mems = await fetchJSONData("./memories.json");
  console.log({ mems });

  // find unique dates
  const dates = [...new Set(mems.memories.map((memory) => memory[0]))];

  // target elements
  const memsDiv = document.querySelector(".memories");
  const images = document.querySelector(".images");
  const h1 = document.querySelector("h1");

  const groupedMemories = dates.map((date) => {
    return {
      date,
      memories: mems.memories
        .filter((memory) => memory[0] === date)
        .map((memory) => ({
          text: memory[1],
          image: memory[2],
        })),
    };
  });

  renderGroupedMemories(groupedMemories, memsDiv);

  // Now that memories are rendered, we can select them and render images
  const memoryElements = document.querySelectorAll(".memory");
  renderImages(memoryElements, images);

  // Set up scroll event listener
  setupScrollListener(memoryElements, images, h1);
}

// Call initialize when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initialize();
});
