// Fonction pour ouvrir la base de données
async function openDB() {
    const dbRequest = indexedDB.open("CoffeeShopDB", 1);
    
    dbRequest.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("cart")) {
            db.createObjectStore("cart", { keyPath: "id" });
        }
    };

    return new Promise((resolve, reject) => {
        dbRequest.onsuccess = (event) => resolve(event.target.result);
        dbRequest.onerror = (event) => reject(event.target.error);
    });
}

async function loadProductsFromCart() {
    try {
        const db = await openDB(); // Ouvrir la base de données
        const transaction = db.transaction("cart", "readonly");
        const store = transaction.objectStore("cart");

        // Récupérer tous les produits du panier
        const request = store.getAll();

        request.onsuccess = (event) => {
            const cartItems = event.target.result; // Produits du panier
            displayCartItem(cartItems); // Afficher les produits dans le panier
        };

        request.onerror = (event) => {
            console.error("Erreur lors de la récupération des produits du panier:", event.target.error);
        };
    } catch (error) {
        console.error("Erreur lors de l'ouverture de la base de données:", error);
    }
}

// Fonction pour afficher chaque produit dans le panier
function displayCartItem(products) {
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = ''; // Vider le contenu actuel
    products.forEach(product => {
        cartContainer.appendChild(createCartItemRow(product)); // Créer et ajouter une ligne pour chaque produit
    });
}

// Fonction pour créer une ligne de tableau pour un produit du panier
function createCartItemRow(product) {
    const row = document.createElement('tr'); // Créer une ligne de tableau
    const totalPrice = product.price * product.quantity; // Calculer le prix total

    row.innerHTML = `
        <td>${product.name}</td>
        <td>${product.price} dh</td>
        <td>${product.quantity}</td>
        <td>${totalPrice} dh</td>
    `; // Remplir les colonnes avec les informations du produit

    return row; // Retourner la ligne créée
}

// Appeler la fonction pour charger les produits lors du chargement de la page
document.addEventListener('DOMContentLoaded', loadProductsFromCart);
// Fonction pour mettre à jour la quantité d'un article
async function updateQuantity(itemId, newQuantity) {
    try {
        const db = await openDB(); // Ouvrir la base de données
        const transaction = db.transaction("cart", "readwrite");
        const store = transaction.objectStore("cart");

        // Récupérer l'article existant
        const request = store.get(itemId);
        request.onsuccess = (event) => {
            const product = event.target.result;
            if (product) {
                product.quantity = newQuantity; // Mettre à jour la quantité
                store.put(product); // Enregistrer les modifications

                // Mettre à jour l'affichage
                loadProductsFromCart(); // Recharger les produits pour l'affichage
            }
        };

        request.onerror = (event) => {
            console.error("Erreur lors de la mise à jour de la quantité:", event.target.error);
        };
    } catch (error) {
        console.error("Erreur lors de l'ouverture de la base de données:", error);
    }
}

// Fonction pour supprimer un article du panier
async function removeFromCart(itemId) {
    try {
        const db = await openDB(); // Ouvrir la base de données
        const transaction = db.transaction("cart", "readwrite");
        const store = transaction.objectStore("cart");

        // Supprimer l'article
        const request = store.delete(itemId);
        request.onsuccess = () => {
            console.log(`Produit ${itemId} supprimé du panier.`);
            loadProductsFromCart(); 
        };

        request.onerror = (event) => {
            console.error("Erreur lors de la suppression de l'article du panier:", event.target.error);
        };
    } catch (error) {
        console.error("Erreur lors de l'ouverture de la base de données:", error);
    }
}

// Mise à jour de la fonction displayCartItem pour inclure des boutons de mise à jour et de suppression
function displayCartItem(products) {
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = ''; // Vider le contenu actuel
    products.forEach(product => {
        cartContainer.appendChild(createCartItemRow(product));
    });
}

// Modifier createCartItemRow pour ajouter des boutons de mise à jour et de suppression
function createCartItemRow(product) {
    const row = document.createElement('tr');
    const totalPrice = product.price * product.quantity;

    row.innerHTML = `
        <td class="product-cell">
            <img src="${product.image_url}" alt="${product.name}" class="product-image">
            <span class="product-name">${product.name}</span>
        </td>
        <td>${product.price} dh</td>
        <td>
            <div class="quantity-control">
                <button onclick="decreaseQuantity('${product.id}')">-</button>
                <input type="number" min="1" value="${product.quantity}" 
                       onchange="updateQuantity('${product.id}', this.value)" />
                <button onclick="increaseQuantity('${product.id}')">+</button>
            </div>
        </td>
        <td>${totalPrice} dh</td>
        <td>
            <button onclick="removeFromCart('${product.id}')" class="delete-btn">x</button>
        </td>
        
    `;

    return row;
}

// Appeler la fonction pour charger les produits lors du chargement de la page
document.addEventListener('DOMContentLoaded', loadProductsFromCart);


// Fonction pour augmenter la quantité d'un article
async function increaseQuantity(itemId) {
    const db = await openDB();
    const transaction = db.transaction("cart", "readwrite");
    const store = transaction.objectStore("cart");

    const request = store.get(itemId);
    request.onsuccess = (event) => {
        const product = event.target.result;
        if (product) {
            product.quantity += 1; // Augmenter la quantité
            store.put(product); // Enregistrer les modifications
            loadProductsFromCart(); // Recharger l'affichage
        }
    };
}

// Fonction pour diminuer la quantité d'un article
async function decreaseQuantity(itemId) {
    const db = await openDB();
    const transaction = db.transaction("cart", "readwrite");
    const store = transaction.objectStore("cart");

    const request = store.get(itemId);
    request.onsuccess = (event) => {
        const product = event.target.result;
        if (product && product.quantity > 1) {
            product.quantity -= 1; // Diminuer la quantité si elle est supérieure à 1
            store.put(product); // Enregistrer les modifications
            loadProductsFromCart(); // Recharger l'affichage
        }
    };
}
