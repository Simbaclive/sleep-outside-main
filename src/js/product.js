import { setLocalStorage } from "./utils.mjs";
import ProductData from "./ProductData.mjs";

const dataSource = new ProductData("tents");

function addProductToCart(product) {
  setLocalStorage("so-cart", product);


  const cartIcon = document.querySelector(".cart");
  

  cartIcon.classList.add("animate");

 
  setTimeout(() => {
    cartIcon.classList.remove("animate");
  }, 500); 
}


async function addToCartHandler(e) {
  const product = await dataSource.findProductById(e.target.dataset.id);
  addProductToCart(product);
}


document
  .getElementById("addToCart")
  .addEventListener("click", addToCartHandler);
