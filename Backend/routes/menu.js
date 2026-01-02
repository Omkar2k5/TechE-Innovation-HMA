import express from 'express';
import Menu from '../models/Menu.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all menu items for a hotel
// @route   GET /api/menu
// @access  Private (Receptionist, Manager, Owner)
router.get('/', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    console.log('🔍 Fetching menu for hotel:', hotelId);

    // Find or create menu document for hotel ID
    let menuDocument = await Menu.findById(hotelId);

    if (!menuDocument) {
      console.log('📝 No menu document found for hotel:', hotelId, '- Creating new one');

      // Get hotel information to create menu document
      const Hotel = (await import('../models/Hotel.js')).default;
      const hotel = await Hotel.findById(hotelId);

      if (!hotel) {
        console.log('❌ Hotel not found:', hotelId);
        return res.status(404).json({
          success: false,
          message: 'Hotel not found'
        });
      }

      // Create new menu document with empty arrays
      menuDocument = new Menu({
        _id: hotelId,
        hotelName: hotel.name,
        menuItems: [],
        savedIngredients: [],
        menuCategories: [
          { name: 'Appetizer', displayOrder: 1, isActive: true },
          { name: 'Main Course', displayOrder: 2, isActive: true },
          { name: 'Dessert', displayOrder: 3, isActive: true },
          { name: 'Beverage', displayOrder: 4, isActive: true }
        ],
        menuSettings: {
          defaultPreparationTime: 15,
          autoGenerateItemId: true,
          showNutritionalInfo: false,
          showAllergens: true
        }
      });

      await menuDocument.save();
      console.log('✅ Created new menu document for hotel:', hotel.name);
    }

    console.log('✅ Menu found:', menuDocument.menuItems.length, 'items');

    // Return menu with summary statistics
    const menuStats = {
      totalItems: menuDocument.menuItems.length,
      availableItems: menuDocument.menuItems.filter(item => item.isAvailable).length,
      categoryCounts: menuDocument.menuItems.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {}),
      totalIngredients: menuDocument.savedIngredients.length,
      averagePrice: menuDocument.menuItems.length > 0
        ? Math.round((menuDocument.menuItems.reduce((sum, item) => sum + (item.price || 0), 0) / menuDocument.menuItems.length) * 100) / 100
        : 0
    };

    res.status(200).json({
      success: true,
      message: 'Menu retrieved successfully',
      data: {
        hotelId: menuDocument._id,
        hotelName: menuDocument.hotelName,
        menuItems: menuDocument.menuItems,
        savedIngredients: menuDocument.savedIngredients,
        menuCategories: menuDocument.menuCategories,
        menuSettings: menuDocument.menuSettings,
        stats: menuStats,
        lastUpdated: menuDocument.lastUpdated
      }
    });

  } catch (error) {
    console.error('❌ Get Menu Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching menu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Add new menu item
// @route   POST /api/menu/items
// @access  Private (Receptionist, Manager, Owner)
router.post('/items', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { name, description, ingredients, price, category, preparationTime, allergens, nutritionalInfo } = req.body;
    const hotelId = req.user.hotelId;

    console.log('➕ Adding new menu item:', { hotelId, name, category });

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Menu item name is required'
      });
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one ingredient is required'
      });
    }

    // Find the menu document
    let menuDocument = await Menu.findById(hotelId);

    if (!menuDocument) {
      // If no menu document exists, create one first
      const Hotel = (await import('../models/Hotel.js')).default;
      const hotel = await Hotel.findById(hotelId);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: 'Hotel not found'
        });
      }

      menuDocument = new Menu({
        _id: hotelId,
        hotelName: hotel.name,
        menuItems: [],
        savedIngredients: [],
        menuCategories: []
      });
    }

    // Generate unique item ID
    const itemId = menuDocument.menuSettings.autoGenerateItemId
      ? `MENU_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : `ITEM_${menuDocument.menuItems.length + 1}`;

    // Check if item with same name already exists
    const existingItem = menuDocument.menuItems.find(item =>
      item.name.toLowerCase() === name.toLowerCase()
    );

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Menu item with this name already exists'
      });
    }

    // Create new menu item
    const newMenuItem = {
      itemId: itemId,
      name: name.trim(),
      description: description?.trim() || '',
      ingredients: ingredients.filter(ing => ing && ing.trim()).map(ing => ing.trim()),
      price: price || 0,
      category: category || 'main',
      preparationTime: preparationTime || menuDocument.menuSettings.defaultPreparationTime,
      allergens: allergens || [],
      nutritionalInfo: nutritionalInfo || {},
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add the menu item
    menuDocument.menuItems.push(newMenuItem);

    // Update saved ingredients
    const newIngredients = newMenuItem.ingredients.filter(ing =>
      !menuDocument.savedIngredients.some(saved =>
        saved.name.toLowerCase() === ing.toLowerCase()
      )
    );

    newIngredients.forEach(ing => {
      menuDocument.savedIngredients.push({
        name: ing,
        category: 'other',
        isActive: true
      });
    });

    // Save the document
    await menuDocument.save();

    console.log(`✅ Menu item "${name}" added successfully with ID: ${itemId}`);

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      data: {
        menuItem: newMenuItem,
        totalItems: menuDocument.menuItems.length,
        totalIngredients: menuDocument.savedIngredients.length
      }
    });

  } catch (error) {
    console.error('❌ Add Menu Item Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while adding menu item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update menu item
// @route   PUT /api/menu/items/:itemId
// @access  Private (Receptionist, Manager, Owner)
router.put('/items/:itemId', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, description, ingredients, price, category, preparationTime, allergens, nutritionalInfo, isAvailable } = req.body;
    const hotelId = req.user.hotelId;

    console.log('🔄 Updating menu item:', { hotelId, itemId, name });

    // Find the menu document
    const menuDocument = await Menu.findById(hotelId);

    if (!menuDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel menu not found'
      });
    }

    // Find the specific menu item
    const itemIndex = menuDocument.menuItems.findIndex(item => item.itemId === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Menu item ${itemId} not found`
      });
    }

    // Check if new name conflicts with existing items (excluding current item)
    if (name && name.trim()) {
      const nameConflict = menuDocument.menuItems.find((item, index) =>
        index !== itemIndex && item.name.toLowerCase() === name.toLowerCase()
      );

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: 'Menu item with this name already exists'
        });
      }
    }

    // Update the menu item
    const menuItem = menuDocument.menuItems[itemIndex];

    if (name !== undefined) menuItem.name = name.trim();
    if (description !== undefined) menuItem.description = description.trim();
    if (ingredients !== undefined) {
      menuItem.ingredients = ingredients.filter(ing => ing && ing.trim()).map(ing => ing.trim());

      // Update saved ingredients
      const newIngredients = menuItem.ingredients.filter(ing =>
        !menuDocument.savedIngredients.some(saved =>
          saved.name.toLowerCase() === ing.toLowerCase()
        )
      );

      newIngredients.forEach(ing => {
        menuDocument.savedIngredients.push({
          name: ing,
          category: 'other',
          isActive: true
        });
      });
    }
    if (price !== undefined) menuItem.price = price;
    if (category !== undefined) menuItem.category = category;
    if (preparationTime !== undefined) menuItem.preparationTime = preparationTime;
    if (allergens !== undefined) menuItem.allergens = allergens;
    if (nutritionalInfo !== undefined) menuItem.nutritionalInfo = nutritionalInfo;
    if (isAvailable !== undefined) menuItem.isAvailable = isAvailable;

    menuItem.updatedAt = new Date();

    // Save the document
    await menuDocument.save();

    console.log(`✅ Menu item ${itemId} updated successfully`);

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: {
        menuItem: menuDocument.menuItems[itemIndex],
        updatedAt: menuItem.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Update Menu Item Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating menu item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Delete menu item
// @route   DELETE /api/menu/items/:itemId
// @access  Private (Receptionist, Manager, Owner)
router.delete('/items/:itemId', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { itemId } = req.params;
    const hotelId = req.user.hotelId;

    console.log('🗑️ Deleting menu item:', { hotelId, itemId });

    // Find the menu document
    const menuDocument = await Menu.findById(hotelId);

    if (!menuDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel menu not found'
      });
    }

    // Find the specific menu item
    const itemIndex = menuDocument.menuItems.findIndex(item => item.itemId === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Menu item ${itemId} not found`
      });
    }

    // Remove the menu item
    const deletedItem = menuDocument.menuItems[itemIndex];
    menuDocument.menuItems.splice(itemIndex, 1);

    // Save the document
    await menuDocument.save();

    console.log(`✅ Menu item ${itemId} deleted successfully`);

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
      data: {
        deletedItem: deletedItem,
        remainingItems: menuDocument.menuItems.length
      }
    });

  } catch (error) {
    console.error('❌ Delete Menu Item Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting menu item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get saved ingredients
// @route   GET /api/menu/ingredients
// @access  Private (Receptionist, Manager, Owner)
router.get('/ingredients', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const hotelId = req.user.hotelId;

    console.log('🔍 Fetching saved ingredients for hotel:', hotelId);

    // Find the menu document
    const menuDocument = await Menu.findById(hotelId);

    if (!menuDocument) {
      return res.status(200).json({
        success: true,
        message: 'No saved ingredients found',
        data: {
          ingredients: []
        }
      });
    }

    // Return active ingredients only
    const activeIngredients = menuDocument.savedIngredients.filter(ing => ing.isActive);

    console.log('✅ Found', activeIngredients.length, 'saved ingredients');

    res.status(200).json({
      success: true,
      message: 'Saved ingredients retrieved successfully',
      data: {
        ingredients: activeIngredients,
        total: activeIngredients.length
      }
    });

  } catch (error) {
    console.error('❌ Get Ingredients Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching ingredients',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Delete saved ingredient
// @route   DELETE /api/menu/ingredients/:ingredientName
// @access  Private (Receptionist, Manager, Owner)
router.delete('/ingredients/:ingredientName', protect, authorize('receptionist', 'manager', 'owner'), async (req, res) => {
  try {
    const { ingredientName } = req.params;
    const hotelId = req.user.hotelId;

    console.log('🗑️ Deleting saved ingredient:', { hotelId, ingredientName });

    // Find the menu document
    const menuDocument = await Menu.findById(hotelId);

    if (!menuDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel menu not found'
      });
    }

    // Find and remove the ingredient
    const ingredientIndex = menuDocument.savedIngredients.findIndex(ing =>
      ing.name.toLowerCase() === ingredientName.toLowerCase()
    );

    if (ingredientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Ingredient "${ingredientName}" not found`
      });
    }

    // Remove the ingredient
    menuDocument.savedIngredients.splice(ingredientIndex, 1);

    // Save the document
    await menuDocument.save();

    console.log(`✅ Ingredient "${ingredientName}" deleted successfully`);

    res.status(200).json({
      success: true,
      message: 'Ingredient deleted successfully',
      data: {
        deletedIngredient: ingredientName,
        remainingIngredients: menuDocument.savedIngredients.length
      }
    });

  } catch (error) {
    console.error('❌ Delete Ingredient Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting ingredient',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Add saved ingredient with stock management
// @route   POST /api/menu/ingredients
// @access  Private (Manager, Owner)
router.post('/ingredients', protect, authorize('manager', 'owner'), async (req, res) => {
  try {
    const { name, category, stock, unit, costPerUnit, supplier, lowStockThreshold } = req.body;
    const hotelId = req.user.hotelId;

    console.log('➕ Adding ingredient with all fields:', {
      hotelId, name, category, stock, unit, costPerUnit, supplier, lowStockThreshold
    });

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Ingredient name is required'
      });
    }

    // Find or create menu document
    let menuDocument = await Menu.findById(hotelId);

    if (!menuDocument) {
      const Hotel = (await import('../models/Hotel.js')).default;
      const hotel = await Hotel.findById(hotelId);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: 'Hotel not found'
        });
      }

      menuDocument = new Menu({
        _id: hotelId,
        hotelName: hotel.name,
        menuItems: [],
        savedIngredients: [],
        menuCategories: []
      });
    }

    // Check if ingredient already exists
    const existing = menuDocument.savedIngredients.find(ing =>
      ing.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ingredient already exists'
      });
    }

    // Add new ingredient with stock info
    const newIngredient = {
      name: name.trim(),
      category: category || 'other',
      stock: stock || 0,
      unit: unit || 'grams',
      costPerUnit: costPerUnit || 0,
      supplier: supplier || '',
      lowStockThreshold: lowStockThreshold || 5,
      isActive: true
    };

    menuDocument.savedIngredients.push(newIngredient);
    await menuDocument.save();

    console.log(`✅ Ingredient "${name}" added with stock: ${stock} ${unit}`);

    res.status(201).json({
      success: true,
      message: 'Ingredient added successfully',
      data: {
        ingredient: newIngredient,
        totalIngredients: menuDocument.savedIngredients.length
      }
    });

  } catch (error) {
    console.error('❌ Add Ingredient Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while adding ingredient',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update ingredient stock
// @route   PUT /api/menu/ingredients/:ingredientName/stock
// @access  Private (Manager, Owner, Cook)
router.put('/ingredients/:ingredientName/stock', protect, authorize('manager', 'owner', 'cook'), async (req, res) => {
  try {
    const { ingredientName } = req.params;
    const { stock, adjustment } = req.body;
    const hotelId = req.user.hotelId;

    console.log('🔄 Updating ingredient stock:', { hotelId, ingredientName, stock, adjustment });

    const menuDocument = await Menu.findById(hotelId);

    if (!menuDocument) {
      return res.status(404).json({
        success: false,
        message: 'Hotel menu not found'
      });
    }

    const ingredient = menuDocument.savedIngredients.find(ing =>
      ing.name.toLowerCase() === ingredientName.toLowerCase()
    );

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: `Ingredient "${ingredientName}" not found`
      });
    }

    // Update stock - either set directly or adjust
    if (stock !== undefined) {
      ingredient.stock = Math.max(0, stock);
    } else if (adjustment !== undefined) {
      ingredient.stock = Math.max(0, (ingredient.stock || 0) + adjustment);
    }

    await menuDocument.save();

    console.log(`✅ Ingredient "${ingredientName}" stock updated to: ${ingredient.stock}`);

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        ingredient: ingredient
      }
    });

  } catch (error) {
    console.error('❌ Update Stock Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating stock',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
