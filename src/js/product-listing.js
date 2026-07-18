import ProductData from "./ProductData.mjs";
import ProductList from "./ProductList.mjs";
import { getParam } from "./utils.mjs";



const category = getParam("category");
const dataSource = new ProductData();
const listElement = document.querySelector(".product-list");

const titleElement = document.querySelector(".products h2");
titleElement.textContent += `: ${category.charAt(0).toUpperCase() + category.slice(1)}`;

const myList = new ProductList(category, dataSource, listElement);
myList.init();
