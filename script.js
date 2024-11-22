document.addEventListener('DOMContentLoaded', () => {
    getProducts();
});

let products = []; // Déclaration de la variable globale pour stocker les produits

// Récupérer les données des produits depuis l'API
function getProducts() {
    fetch('https://fake-coffee-api.vercel.app/api')
        .then(response => response.json())
        .then(data => {
            products = data;
            displayProducts(products);
            addProductsToDB(products); // Stocke les produits dans IndexedDB
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des produits:", error);
            loadProductsFromDB(); // Charge les produits depuis IndexedDB en cas d'erreur
        });
}
async function loadProductsFromDB() {
    try {
        const db = await openDB(); // Ouvre la base de données
        const transaction = db.transaction("products", "readonly");
        const store = transaction.objectStore("products");

        const products = []; // Tableau pour stocker les produits récupérés

        // Utilise un curseur pour parcourir tous les produits
        store.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                products.push(cursor.value); // Ajoute chaque produit au tableau
                cursor.continue(); // Passe au produit suivant
            } else {
                // Lorsque tous les produits sont récupérés, les afficher
                displayProducts(products);
            }
        };

        transaction.oncomplete = () => {
            console.log("Produits chargés depuis IndexedDB");
        };

        transaction.onerror = (event) => {
            console.error("Erreur lors de la lecture des produits depuis IndexedDB:", event.target.error);
        };

    } catch (error) {
        console.error("Erreur lors de l'ouverture de la base de données:", error);
    }
}

async function addProductsToDB(products) {
    try {
        const db = await openDB(); // Ouvrir la connexion à la base de données

        const transaction = db.transaction("products", "readwrite");
        const store = transaction.objectStore("products");

        // Efface les anciens produits avant d'ajouter les nouveaux pour éviter les doublons
        store.clear();

        // Ajouter chaque produit dans l'object store
        products.forEach(product => {
            store.put(product); // Utilise `put` pour ajouter ou mettre à jour les produits
        });

        transaction.oncomplete = () => {
            console.log("Tous les produits ont été ajoutés à la base de données avec succès");
        };

        transaction.onerror = (event) => {
            console.error("Erreur lors de l'ajout des produits dans la base de données:", event.target.error);
        };
    } catch (error) {
        console.error("Erreur lors de l'ouverture de la base de données:", error);
    }
}




// Créer une carte de produit
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="${product.image_url}" alt="${product.title}">
        <h3>${product.name}</h3>
        <div class="product-info">
            <h4 class="price">${product.price}dh</h4>
            <p class="description">${product.description}</p>
            <button onclick="addToCart('${product.id}')" class="add-to-cart">+</button>
        </div>
    `;
    return card;
}

// Afficher les produits
function displayProducts(products) {
    const grid = document.querySelector('.product-content');
    grid.innerHTML = '';
    products.forEach(product => {
        grid.appendChild(createProductCard(product));
    });
    setGridView(); // Initialiser la vue par défaut après le chargement des produits
}

// Ajouter les écouteurs d'événements aux icônes
document.getElementById('grid-view-btn').addEventListener('click', setGridView);
document.getElementById('list-view-btn').addEventListener('click', setListView);

// Fonction pour passer en vue grille
function setGridView() {
    document.querySelector('.product-content').classList.add('grid-view');
    document.querySelector('.product-content').classList.remove('list-view');

    document.querySelectorAll('.product-card').forEach(card => {
        card.style.display = 'inline-block';
        card.style.width = 'calc(33% - 20px)';
        card.style.margin = '10px';
    });
}

// Fonction pour passer en vue liste
function setListView() {
    document.querySelector('.product-content').classList.add('list-view');
    document.querySelector('.product-content').classList.remove('grid-view');

    document.querySelectorAll('.product-card').forEach(card => {
        card.style.display = 'flex';
        card.style.width = '100%';
        card.style.margin = '10px 0';
    });

    document.querySelectorAll('.product-card img').forEach(img => {
        img.style.maxWidth = "200px";
    });

    document.querySelectorAll('.product-card button').forEach(btn => {
        btn.style.alignSelf = 'flex-end';
    });
}

// Fonction pour filtrer les produits
function filterProducts() {
    const searchValue = document.getElementById('search-input').value.toLowerCase();
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchValue) ||
        product.description.toLowerCase().includes(searchValue)
    );
    displayProducts(filteredProducts);
}

// Écouteur d'événement pour le champ de recherche
document.getElementById('search-input').addEventListener('input', filterProducts);


function openDB() {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open("CoffeeShopDB", 1);

        dbRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("products")) {
                db.createObjectStore("products", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("cart")) {
                db.createObjectStore("cart", { keyPath: "id" });
            }
        };

        dbRequest.onsuccess = (event) => {
            console.log("Base de données ouverte avec succès");
            resolve(event.target.result); // Renvoie l'instance de la base de données
        };

        dbRequest.onerror = (event) => {
            console.error("Erreur lors de l'ouverture de la base de données:", event.target.error);
            reject(event.target.error);
        };
    });
}

async function addToCart(productId) {
    try {
        const db = await openDB(); // Ouvre la base de données
        const transaction = db.transaction("cart", "readwrite");
        const store = transaction.objectStore("cart");

        // Récupérer les détails du produit à partir de l'array products
        let product_detail = products.find(p => p.id == productId);

        // Créer l'objet à stocker dans le panier
        const cartItem = {
            id: productId,
            image_url: product_detail.image_url, // Utiliser le champ correct pour l'image
            name: product_detail.name,
            price: product_detail.price,
            quantity: 1
        };

        // Ajouter le produit dans l'object store "cart"
        store.put(cartItem); // Utilise `put` pour ajouter ou mettre à jour le produit
        
        transaction.oncomplete = () => {
            console.log("Produit ajouté au panier avec succès");
        };

        transaction.onerror = (event) => {
            console.error("Erreur lors de l'ajout du produit au panier:", event.target.error);
        };

    } catch (error) {
        console.error("Erreur lors de l'ouverture de la base de données:", error);
    }
}

