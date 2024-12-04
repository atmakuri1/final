'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Alert,
  Snackbar,
  AppBar,
  Toolbar,
  FormControl,
  Select,
  Paper,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Clear as ClearIcon,
  Remove as RemoveIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  ShoppingCart,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { commonStyles } from '@/theme/style';
import { componentStyles } from '@/theme/componentStyle';
import axios from 'axios';
import TranslateIcon from '@mui/icons-material/Translate';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogActions,
  Rating,
  Stack
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

interface Item {
  menu_item_id: number;
  price: number;
  name: string;
  type: string;
}

interface CartEntry {
  category: string;
  items: Item[];
  price: number;
}

const categories = ["Bowl", "Plate", "Bigger Plate", "A La Carte", "Appetizers & Dessert", "Drinks"];
const TAX_RATE = 0.0625;
const PREMIUM_UPCHARGE = 1.50;

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ko', name: 'Korean' },
  { code: 'ja', name: 'Japanese' },
  { code: 'vi', name: 'Vietnamese' },
];

interface RatingItem {
  itemName: string;
  rating: number | null;
}

const findMenuItemIdByName = (menuItems: Item[], name: string): number | undefined => {
  const item = menuItems.find(item => item.name === name);
  return item?.menu_item_id;
};

const KioskGUI: React.FC = () => {
  const [menuItems, setMenuItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [showStartPage, setShowStartPage] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);

  const [textSize, setTextSize] = useState('normal');

  const [showRating, setShowRating] = useState(false);
  const [itemRatings, setItemRatings] = useState<RatingItem[]>([]);

  //const [orderCompleteText, setOrderCompleteText] = useState('Order Complete!');
  const [emptyCartText, setEmptyCartText] = useState('Your order is empty');
  const [selectItemsText, setSelectItemsText] = useState('Select items to begin your order');
  const [showOrderComplete, setShowOrderComplete] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const handleSubmitRatings = () => {
    // Handle the submission of ratings
    handleRatingClose(undefined, undefined, false);
  };
  
  const handleSkipRatings = () => {
    // Skip the ratings process
    handleRatingClose(undefined, undefined, true);
  };

  const handleRatingClose = async (
  event?: {}, 
  reason?: "backdropClick" | "escapeKeyDown",
  skipRatings: boolean = false
) => {
  if (!skipRatings) {
    try {
      const ratingsToSubmit = itemRatings
        .filter(item => item.rating !== null)
        .map(item => ({
          menuItemId: findMenuItemIdByName(menuItems, item.itemName),
          rating: item.rating
        }))
        .filter(item => item.menuItemId !== undefined);

      if (ratingsToSubmit.length > 0) {
        await axios.post('/api/kiosk', { ratings: ratingsToSubmit });
        console.log('Ratings submitted successfully:', ratingsToSubmit);
      }
    } catch (error) {
      console.error('Error submitting ratings:', error);
      setErrorMessage('Failed to submit ratings');
    }
  }
  
  setShowRating(false);
  setShowSuccess(true);
  setCart([]);
  setShowStartPage(true);
  setCustomerName('');
  setItemRatings([]);
};

  const handleStartPageClick = () => {
    setShowNameInput(true);
  };

  const handleNameSubmit = () => {
    if (customerName.trim()) {
      setShowStartPage(false);
      setShowNameInput(false);
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }));
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));
    }, 1000);
  
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedLanguage !== 'en') {
      const textsToTranslate = ['Order Complete!', 'Your order is empty', 'Select items to begin your order'];
      
      axios.post<TranslationResponse>(
        `https://translation.googleapis.com/language/translate/v2?key=AIzaSyC1dU272Iybb_NoVzVgo1gk045EpwIBTW0`,
        {
          q: textsToTranslate,
          target: selectedLanguage,
          format: 'text'
        }
      ).then(response => {
        const translations = response.data.data.translations;
        //setOrderCompleteText(translations[0].translatedText);
        setEmptyCartText(translations[1].translatedText);
        setSelectItemsText(translations[2].translatedText);
      }).catch(error => {
        console.error('Notification translation error:', error);
      });
    } else {
      // Reset to English
      //setOrderCompleteText('Order Complete!');
      setEmptyCartText('Your order is empty');
      setSelectItemsText('Select items to begin your order');
    }
  }, [selectedLanguage]);

  const setTranslatedErrorMessage = async (message: string) => {
    if (selectedLanguage === 'en') {
      setErrorMessage(message);
      return;
    }
  
    try {
      const response = await axios.post<TranslationResponse>(
        `https://translation.googleapis.com/language/translate/v2?key=AIzaSyC1dU272Iybb_NoVzVgo1gk045EpwIBTW0`,
        {
          q: [message],
          target: selectedLanguage,
          format: 'text'
        }
      );
      setErrorMessage(response.data.data.translations[0].translatedText);
    } catch (error) {
      console.error('Error message translation error:', error);
      setErrorMessage(message); // Fallback to English if translation fails
    }
  };

  useEffect(() => {
    if (showRating && selectedLanguage !== 'en') {
      const timeoutId = setTimeout(() => {
        const dialogElements = document.querySelectorAll(
          '.MuiDialog-root .MuiTypography-root:not(.MuiRating-root *), ' + // Exclude rating elements
          '.MuiDialog-root .MuiButton-root:not(.MuiRating-root *), ' +
          '.MuiDialogTitle .MuiTypography-root:not(.MuiRating-root *), ' +
          '.MuiDialogContent .MuiTypography-root:not(.MuiRating-root *)'
        );
  
        // Add data-no-translate to rating elements
        document.querySelectorAll('.MuiRating-root, .MuiRating-root *').forEach(el => {
          el.setAttribute('data-no-translate', 'true');
        });
  
        const textsToTranslate = Array.from(dialogElements)
          .filter(el => {
            const text = el.textContent || '';
            return (
              text.trim() !== '' && 
              !text.includes('$') && 
              !el.closest('.MuiRating-root') && // Exclude elements within rating component
              !el.hasAttribute('data-no-translate')
            );
          })
          .map(el => {
            if (!el.getAttribute('data-original-text')) {
              el.setAttribute('data-original-text', el.textContent || '');
            }
            return el.textContent || '';
          });
  
        if (textsToTranslate.length > 0) {
          axios.post<TranslationResponse>(
            `https://translation.googleapis.com/language/translate/v2?key=AIzaSyC1dU272Iybb_NoVzVgo1gk045EpwIBTW0`,
            {
              q: textsToTranslate,
              target: selectedLanguage,
              format: 'html'
            }
          ).then(response => {
            const translations = response.data.data.translations;
            let translationIndex = 0;
  
            dialogElements.forEach((element) => {
              const text = element.textContent || '';
              if (
                text.trim() !== '' && 
                !text.includes('$') && 
                !element.closest('.MuiRating-root') &&
                !element.hasAttribute('data-no-translate')
              ) {
                if (translations[translationIndex]) {
                  element.textContent = translations[translationIndex].translatedText;
                  translationIndex++;
                }
              }
            });
          }).catch(error => {
            console.error('Dialog translation error:', error);
          });
        }
      }, 300);
  
      return () => clearTimeout(timeoutId);
    }
  }, [showRating, selectedLanguage]);
  
  interface OrderResponse {
    success: boolean;
    orderId: number;
    message: string;
  }

  const handleCompletePurchase = async () => {
    try {
      const orderData = {
        customerName: customerName,
        price: Number(total.toFixed(2)),
        items: cart
      };
  
      console.log('Sending order data:', orderData);
  
      // Fix the endpoint URL to include /api/
      const response = await axios.post<OrderResponse>('/api/kiosk', orderData);
      
      if (!response.data.success) {
        throw new Error('Failed to submit order');
      }
  
      setShowOrderComplete(true);
      
      setTimeout(async () => {
        try {
          setShowOrderComplete(false);
          const newRatingItems = cart.flatMap(entry => 
            entry.items.map(item => ({
              itemName: item.name,
              rating: null
            }))
          );
          setItemRatings(newRatingItems);
          setShowRating(true);
        } catch (error) {
          console.error('Error in completion process:', error);
          setTranslatedErrorMessage('Failed to complete order process. Please try again.');
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating order:', {
        error,
        response: error.response?.data,
        status: error.response?.status
      });
      setTranslatedErrorMessage(
        error.response?.data?.details || 
        error.response?.data?.error || 
        error.message || 
        'Failed to complete order. Please try again.'
      );
      setShowOrderComplete(false);
    }
  };
  
  const getTextSize = (baseSize: number) => {
    switch (textSize) {
      case 'small': return baseSize * 0.8;
      case 'large': return baseSize * 1.5;
      case 'xlarge': return baseSize * 1.8;
      default: return baseSize;
    }
  };


  const textStyles = {
    h3: { fontSize: getTextSize(30) },
    h4: { fontSize: getTextSize(24) },
    h5: { fontSize: getTextSize(20) },
    h6: { fontSize: getTextSize(18) },
    subtitle1: { fontSize: getTextSize(16) },
    body1: { fontSize: getTextSize(16) },
    body2: { fontSize: getTextSize(14) },
    caption: { fontSize: getTextSize(12) },
    button: { fontSize: getTextSize(16) },
    buttonLarge: { fontSize: getTextSize(18) },
  };


  interface TranslationResponse {
    data: {
      translations: {
        translatedText: string;
      }[];
    };
  }

  
  useEffect(() => {
    // Only translate if a non-English language is selected and cart has items
    if (selectedLanguage !== 'en' && cart.length > 0) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        translatePage();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [cart]);
  
  const encodeForTranslation = (text: string) => {
    return encodeURIComponent(text).replace(/%20/g, ' ');
  };

  const translatePage = async () => {
    if (selectedLanguage === 'en') {
      setIsTranslating(true);
      try {
        const textElements = document.querySelectorAll(
          'h3:not([data-no-translate]), ' + 
          'h4:not([data-no-translate]), ' + 
          'h5:not([data-no-translate]), ' + 
          'h6:not([data-no-translate]), ' + 
          'button:not([data-no-translate]), ' +  
          'p:not([data-no-translate]), ' + 
          '.MuiTypography-root:not([data-no-translate]), ' + 
          'label:not([data-no-translate]), ' +
          '.MuiCardContent-root .MuiTypography-root, ' +
          '.MuiButton-root, ' +  
          '.MuiButton-label, ' +  
          '.MuiDialogTitle .MuiTypography-root, ' +  // Add dialog specific selectors
          '.MuiDialogContent .MuiTypography-root, ' +
          '.MuiDialogActions .MuiButton-root, ' +
          'button > span'
        );
  
        textElements.forEach((element) => {
          const originalText = element.getAttribute('data-original-text');
          if (originalText) {
            if (element.tagName.toLowerCase() === 'button') {
              // For button elements, update their text content directly
              Array.from(element.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .forEach(node => {
                  node.textContent = originalText;
                });
            } else {
              element.textContent = originalText;
            }
          }
        });
  
        document.documentElement.lang = 'en';
      } catch (error) {
        console.error('Error reverting to English:', error);
        setErrorMessage('Failed to revert to English. Please try again.');
      } finally {
        setIsTranslating(false);
      }
      return;
    }
  
    setIsTranslating(true);
  
    try {
      const textElements = document.querySelectorAll(
        'h3:not([data-no-translate]), ' + 
        'h4:not([data-no-translate]), ' + 
        'h5:not([data-no-translate]), ' + 
        'h6:not([data-no-translate]), ' + 
        'button:not([data-no-translate]), ' +  // Target button elements directly
        'p:not([data-no-translate]), ' + 
        '.MuiTypography-root:not([data-no-translate]), ' + 
        'label:not([data-no-translate]), ' +
        '.MuiCardContent-root .MuiTypography-root, ' +
        '.MuiButton-root, ' +  // Target Material-UI buttons
        '.MuiButton-label, ' +  // Target button labels
        'button > span'  // Target spans inside buttons
      );
  
      const textsToTranslate = Array.from(textElements)
        .filter(el => {
          const text = el.textContent || '';
          return (
            text.trim() !== '' &&
            !text.includes('/images/') &&
            !text.includes('.png') &&
            !text.includes('.svg') &&
            !text.startsWith('$') &&
            isNaN(Number(text.replace('$', '').trim()))
          );
        })
        .map(el => {
          if (!el.getAttribute('data-original-text')) {
            el.setAttribute('data-original-text', el.textContent || '');
          }
          return el.textContent || '';
        });
  
      const response = await axios.post<TranslationResponse>(
        `https://translation.googleapis.com/language/translate/v2?key=AIzaSyC1dU272Iybb_NoVzVgo1gk045EpwIBTW0`,
        {
          q: textsToTranslate,
          target: selectedLanguage,
          format: 'html'
        }
      );
  
      const translations = response.data.data.translations;
      let translationIndex = 0;
  
      textElements.forEach((element) => {
        const text = element.textContent || '';
        if (
          text.trim() !== '' &&
          !text.includes('/images/') &&
          !text.includes('.png') &&
          !text.includes('.svg') &&
          !text.startsWith('$') &&
          isNaN(Number(text.replace('$', '').trim()))
        ) {
          if (translations[translationIndex]) {
            if (element.tagName.toLowerCase() === 'button') {
              // For button elements, update their text content directly
              Array.from(element.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .forEach(node => {
                  node.textContent = translations[translationIndex].translatedText;
                });
            } else {
              element.textContent = translations[translationIndex].translatedText;
            }
            translationIndex++;
          }
        }
      });
  
      document.documentElement.lang = selectedLanguage;
  
    } catch (error) {
      console.error('Translation error:', error);
      setErrorMessage('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };


  useEffect(() => {
    async function loadMenuItems() {
      try {
        const response = await fetch('/api/kiosk');
        if (!response.ok) throw new Error('Failed to fetch menu items');
        const items = await response.json();
        setMenuItems(items);
      } catch (err) {
        setError('Failed to load menu items');
        console.error('Error loading menu items:', err);
      }
    }
    
    loadMenuItems();
  }, []);

  useEffect(() => {
    if (selectedLanguage !== 'en') {
      const timeoutId = setTimeout(() => {
        translatePage();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [showCategories]); // Trigger when switching between categories and menu pages
  
  // Trigger translation when category changes
  useEffect(() => {
    if (selectedLanguage !== 'en') {
      const timeoutId = setTimeout(() => {
        translatePage();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedCategory]); // Trigger when selected category changes
  
  // Add this effect to handle language changes
  useEffect(() => {
    if (selectedLanguage !== 'en') {
      const timeoutId = setTimeout(() => {
        translatePage();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedLanguage, showRating]);
  
  useEffect(() => {
    if (showRating && selectedLanguage !== 'en') {
      // Increased delay to ensure dialog is fully rendered
      const timeoutId = setTimeout(() => {
        translatePage();
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [showRating, itemRatings, selectedLanguage]);

  // Clear selection when changing categories
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedItems([]);
    setShowCategories(false);
  };

  const toggleSelectItem = (item: Item) => {
    setSelectedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const addItemToCart = () => {
    const categoryItem = menuItems.find(i => i.name === selectedCategory && i.type === "category");

    if (["Bowl", "Plate", "Bigger Plate"].includes(selectedCategory)) {
        const sideCount = selectedItems.filter(i => i.type === 'side').length;
        const entreeCount = selectedItems.filter(i => i.type === 'entree' || i.type === 'premium entree').length;
        let valid = false;
        if (selectedCategory === 'Bowl' && sideCount === 1 && entreeCount === 1) {
            valid = true;
        } else if (selectedCategory === 'Plate' && sideCount === 1 && entreeCount === 2) {
            valid = true;
        } else if (selectedCategory === 'Bigger Plate' && sideCount === 1 && entreeCount === 3) {
            valid = true;
        }
        if (!valid) {
            const message = `Please select ${selectedCategory === 'Bowl' ? '1 side and 1 entree' :
                selectedCategory === 'Plate' ? '1 side and 2 entrees' : '1 side and 3 entrees'}`;
            setTranslatedErrorMessage(message);
            return;
        }
    }

    if (["A La Carte", "Appetizers & Dessert", "Drinks"].includes(selectedCategory)) {
        const individualEntries = selectedItems.map(item => ({
            category: selectedCategory === "A La Carte" ? "A LA CARTE" : item.name,
            items: [item],
            price: item.price
        }));
        setCart([...cart, ...individualEntries]);
    } else if (categoryItem) {
        const premiumCount = selectedItems.filter(i => i.type === "premium entree").length;
        const premiumCharge = premiumCount * PREMIUM_UPCHARGE;
        const finalPrice = categoryItem.price + premiumCharge;

        setCart([...cart, { category: selectedCategory, items: selectedItems, price: finalPrice }]);
    }

    setSelectedItems([]);
};


  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const subtotal = cart.reduce((sum, entry) => sum + entry.price, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const renderItemSection = (title: string, items: Item[], selectionCount?: number, requiredCount?: number) => (
    <Card sx={{ mb: 4 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={textStyles.h6}>
              {title}
              {requiredCount && (
                <Typography component="span" sx={{ ...textStyles.body1, color: 'text.secondary', ml: 1 }}>
                  Select {requiredCount}
                </Typography>
              )}
            </Typography>
            {selectionCount !== undefined && (
              <Typography sx={{ ...textStyles.body1, color: 'text.secondary' }}>
                {selectionCount} of {requiredCount} selected
              </Typography>
            )}
          </Box>
        }
      />
      <CardContent sx={{ 
          maxHeight: 'calc(100vh - 400px)',
          overflow: 'auto',
          p: 2 
        }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 2,
        }}>
          {items.map((item) => (
            <Button
              key={item.menu_item_id}
              onClick={() => toggleSelectItem(item)}
              variant="text"
              className={selectedItems.includes(item) ? 'selected' : ''}
              sx={{
                ...componentStyles.itemButton,
                height: '14rem',
                position: 'relative',
                '&::before': selectedItems.includes(item) ? {
                  content: '"✓"',
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: '50%',
                  width: '1.5rem',
                  height: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                } : {},
              }}
            >
              <CardMedia
                component="img"
                src={`/images/${item.type}${item.name}.png`}
                alt={item.name}
                sx={{
                  transition: 'transform 0.2s ease',
                  ...commonStyles.itemImage
                }}
              />
              <Typography variant="subtitle1" sx={{ ...textStyles.subtitle1, color: 'black' }}>
                {item.name}
              </Typography>
              {(selectedCategory === "A La Carte" || 
                ["appetizer", "dessert", "drink"].includes(item.type)) && (
                <Typography variant="caption" sx={{ ...textStyles.caption, color: 'black', mt: 0.5 }}>
                  ${item.price.toFixed(2)}
                </Typography>
              )}
            </Button>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  const renderCategoryButton = (category: string) => (
    <Button
      key={category}
      onClick={() => handleCategoryChange(category)}
      variant="contained"
      sx={{
        ...componentStyles.categoryButton,
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0))',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover::after': {
          opacity: 1,
        },
      }}
    >
      <Typography variant="h4" sx={{ ...textStyles.h4, color: 'primary.contrastText', mb: 1 }}>
        {category}
      </Typography>
      {["Bowl", "Plate", "Bigger Plate"].includes(category) && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ ...textStyles.h6, color: 'primary.contrastText', mb: 1 }}>
            {category === "Bowl" ? "1 Side + 1 Entree" :
             category === "Plate" ? "1 Side + 2 Entrees" :
             "1 Side + 3 Entrees"}
          </Typography>
          <Typography variant="h5" sx={{ ...textStyles.h5, color: 'primary.contrastText' }}>
            ${menuItems.find(i => i.name === category)?.price.toFixed(2)}
          </Typography>
        </Box>
      )}
    </Button>
  );

  // Update cart Typography components
  const renderCartItem = (entry: CartEntry, index: number) => (
    <Box
        key={index}
        sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1,
            mb: 1,
            bgcolor: 'grey.50',
            borderRadius: 1,
        }}
    >
        <IconButton 
            onClick={() => setCart(cart.filter((_, i) => i !== index))}
            color="error"
            size="small"
        >
            <RemoveIcon />
        </IconButton>
        <Box sx={{ flex: 1, ml: 1 }}>
            <Typography variant="body1">{entry.category}</Typography>
            {entry.category !== entry.items[0].name && (
                <Typography variant="body2" color="text.secondary">
                    {entry.items.map(i => i.name).join(", ")}
                </Typography>
            )}
        </Box>
        <Typography variant="body1" color="black">
            ${entry.price.toFixed(2)}
        </Typography>
    </Box>
);

  const OrderCompleteOverlay = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ 
          scale: [0.5, 1.2, 1],
          opacity: [0, 1, 1],
        }}
        transition={{
          duration: 0.5,
          times: [0, 0.6, 1],
          ease: "easeOut"
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <CheckCircleIcon 
              sx={{ 
                fontSize: '120px', 
                color: '#4CAF50'
              }} 
            />
          </motion.div>
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
            }}
          >
            Order Complete!
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: 'white',
              textAlign: 'center',
              opacity: 0.9,
            }}
          >
            Thank you, {customerName}!
          </Typography>
        </Box>
      </motion.div>
    </motion.div>
  );

  const getFilteredAndGroupedItems = () => {
    if (selectedCategory === "Appetizers & Dessert") {
      const appetizers = menuItems.filter(item => item.type === "appetizer");
      const desserts = menuItems.filter(item => item.type === "dessert");
      return (
        <>
          {renderItemSection("Appetizers", appetizers)}
          {renderItemSection("Desserts", desserts)}
        </>
      );
    }
    if (selectedCategory === "Drinks") {
      return renderItemSection("Drinks", menuItems.filter(item => item.type === "drink"));
    }
    
    const sides = menuItems.filter(item => item.type === "side");
    const entrees = menuItems.filter(item => 
      item.type === "entree" || item.type === "premium entree"
    );
    const sideCount = selectedItems.filter(i => i.type === 'side').length;
    const entreeCount = selectedItems.filter(i => 
      i.type === 'entree' || i.type === 'premium entree'
    ).length;
    
    let requiredEntrees = 1;
    if (selectedCategory === "Plate") requiredEntrees = 2;
    if (selectedCategory === "Bigger Plate") requiredEntrees = 3;
    
    return (
      <>
        {renderItemSection("Sides", sides, sideCount, 1)}
        {renderItemSection("Entrees", entrees, entreeCount, requiredEntrees)}
      </>
    );
  };

  if (showStartPage) {
    return (
      <Box
        onClick={showNameInput ? undefined : handleStartPageClick}
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgb(192, 40, 39)',
          cursor: showNameInput ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': !showNameInput ? {
            bgcolor: 'rgb(154, 32, 31)',
            '& .start-text': {
              transform: 'scale(1.05)',
            },
          } : {},
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'all 0.3s ease',
          }}
        >
          <img
            src="/images/Panda_Express_2014.svg"
            alt="Panda Express Logo"
            style={{
              width: '16rem',
              marginBottom: '2rem',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
            }}
          />
          {showNameInput ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                p: 4,
                bgcolor: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                minWidth: '300px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography variant="h5" sx={{ color: 'text.primary', mb: 2 }}>
                Enter Your Name
              </Typography>
              <TextField
                fullWidth
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your Name"
                variant="outlined"
                autoFocus
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleNameSubmit}
                disabled={!customerName.trim()}
                sx={{
                  mt: 2,
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
              >
                Start Order
              </Button>
            </Box>
          ) : (
            <Typography
              variant="h3"
              className="start-text"
              sx={{
                color: 'primary.contrastText',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.3s ease',
              }}
            >
              Touch to Start Order
            </Typography>
          )}
        </Box>
      </Box>
    );
  }
  
  // const renderRatingDialog = () => (
  //   <Dialog 
  //     open={showRating} 
  //     onClose={handleRatingClose}
  //     maxWidth="sm"
  //     fullWidth
  //   >
  //     <DialogTitle sx={textStyles.h5}>
  //       Please Rate Your Order
  //     </DialogTitle>
  //     <DialogContent>
  //       <Stack spacing={3} sx={{ mt: 2 }}>
  //         {itemRatings.map((item, index) => (
  //           <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  //             <Typography sx={{ flex: 1, ...textStyles.body1 }}>
  //               {item.itemName}
  //             </Typography>
  //             <Rating
  //               value={item.rating}
  //               onChange={(_, newValue) => {
  //                 const newRatings = [...itemRatings];
  //                 newRatings[index].rating = newValue;
  //                 setItemRatings(newRatings);
  //               }}
  //               data-no-translate="true" // Add this attribute
  //               sx={{
  //                 '& .MuiRating-icon': {
  //                   color: 'rgb(192, 40, 39)',
  //                   transition: 'transform 0.2s, color 0.2s',
  //                   '&:hover': {
  //                     color: 'rgb(172, 36, 35)',
  //                   }
  //                 },
  //                 '& .MuiRating-iconFilled': {
  //                   color: 'rgb(192, 40, 39)',
  //                 },
  //                 '& .MuiRating-iconHover': {
  //                   transform: 'scale(1.2)',
  //                   color: 'rgb(172, 36, 35)',
  //                 }
  //               }}
  //               emptyIcon={
  //                 <StarIcon 
  //                   style={{ 
  //                     opacity: 0.55,
  //                     color: '#e0e0e0'
  //                   }} 
  //                   fontSize="inherit" 
  //                   data-no-translate="true" // Add this attribute
  //                 />
  //               }
  //             />
  //           </Box>
  //         ))}
  //       </Stack>
  //     </DialogContent>
  //     <DialogActions>
  //       <Button onClick={handleRatingClose} color="primary" variant="contained">
  //         Submit Ratings
  //       </Button>
  //       <Button onClick={handleRatingClose} color="error" variant="outlined">
  //         Skip
  //       </Button>
  //     </DialogActions>
  //   </Dialog>
  // );

  const UntranslatedRating: React.FC<{
    value: number | null;
    onChange: (event: React.SyntheticEvent<Element, Event>, value: number | null) => void;
  }> = ({ value, onChange }) => (
    <Box data-no-translate="true" sx={{ display: 'flex', alignItems: 'center' }}>
      <Rating
        value={value}
        onChange={onChange}
        sx={{
          '& .MuiRating-icon': {
            color: 'rgb(192, 40, 39)',
            transition: 'transform 0.2s, color 0.2s',
            '&:hover': {
              color: 'rgb(172, 36, 35)',
            }
          },
          '& .MuiRating-iconFilled': {
            color: 'rgb(192, 40, 39)',
          },
          '& .MuiRating-iconHover': {
            transform: 'scale(1.2)',
            color: 'rgb(172, 36, 35)',
          }
        }}
        emptyIcon={
          <StarIcon 
            style={{ 
              opacity: 0.55,
              color: '#e0e0e0'
            }} 
            fontSize="inherit" 
          />
        }
        IconContainerComponent={(props) => {
          return (
            <span {...props} data-no-translate="true">
              {props.children}
            </span>
          );
        }}
      />
    </Box>
  );
  
  return (
    <Box sx={commonStyles.pageContainer}>
          <AnimatePresence>
      {showOrderComplete && <OrderCompleteOverlay />}
    </AnimatePresence>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!showCategories && (
              <Button
                color="inherit"
                onClick={() => setShowCategories(true)}
                startIcon={<ArrowBackIcon />}
                sx={{ fontSize: textStyles.button.fontSize }}
              >
                Back to Categories
              </Button>
            )}
            <img
              src="/images/Panda_Express_2014.svg"
              alt="Panda Express Logo"
              style={commonStyles.logo}
            />
            
            {/* Translation Dropdown */}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120, ml: 2 }}>
              <Select
                value={selectedLanguage}
                onChange={(e) => {
                  const newLanguage = e.target.value;
                  setSelectedLanguage(newLanguage);
                  setIsTranslating(true);
                  
                  if (newLanguage === 'en') {
                    // ... (existing English revert logic)
                  } else {
                    setTimeout(() => translatePage(), 100);
                  }
                }}
                startAdornment={<TranslateIcon sx={{ mr: 1, color: 'white' }} />}
                sx={{ 
                  color: 'white', 
                  '& .MuiSelect-icon': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: 'white !important' 
                  },
                  // Add text scaling to the selected value
                  fontSize: textStyles.body1.fontSize
                }}
                // Add text scaling to dropdown menu items
                MenuProps={{
                  PaperProps: {
                    sx: {
                      '& .MuiMenuItem-root': {
                        fontSize: textStyles.body1.fontSize
                      }
                    }
                  }
                }}
              >
                {LANGUAGES.map((lang) => (
                  <MenuItem 
                    key={lang.code} 
                    value={lang.code}
                    sx={{ fontSize: 'inherit' }} // Inherit the fontSize from parent
                  >
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl variant="outlined" size="small" sx={{ minWidth: 120, ml: 2 }}>
              <Select
                value={textSize}
                onChange={(e) => setTextSize(e.target.value)}
                startAdornment={<TextFieldsIcon sx={{ mr: 1, color: 'white' }} />}
                sx={{ 
                  color: 'white', 
                  '& .MuiSelect-icon': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { 
                    borderColor: 'white !important' 
                  },
                  ...textStyles.body1
                }}
              >
                <MenuItem value="small" sx={textStyles.body1}>Small Text</MenuItem>
                <MenuItem value="normal" sx={textStyles.body1}>Normal Text</MenuItem>
                <MenuItem value="large" sx={textStyles.body1}>Large Text</MenuItem>
                <MenuItem value="xlarge" sx={textStyles.body1}>Extra Large</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Typography variant="h6" sx={{ color: 'primary.contrastText' }}>
            {currentTime}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Snackbars */}
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={3000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setErrorMessage('')}
          severity="error"
          variant="filled"
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      <Box sx={{
      ...commonStyles.mainContainer,
      pb: '241px'
    }}>
      <Box sx={{
        ...commonStyles.menuContainer,
        width: '90rem',
      }}>
        <Box sx={{
          ...commonStyles.menuContainer,
          width: '90rem',
          mb: '80px', // Add margin bottom to account for fixed buttons
          pb: showCategories ? 0 : 10, // Add padding only when showing menu items
        }}>
          {showCategories ? (
            // Categories Grid
            <Box sx={{
              ...commonStyles.gridContainer,
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 4,
            }}>
              {categories.map((category) => (
                <Button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  variant="contained"
                  sx={{
                    ...componentStyles.categoryButton,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0))',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    },
                    '&:hover::after': {
                      opacity: 1,
                    },
                  }}
                >
                  <Typography variant="h4" sx={{ color: 'primary.contrastText', mb: 1 }}>
                    {category}
                  </Typography>
                  {["Bowl", "Plate", "Bigger Plate"].includes(category) && (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ color: 'primary.contrastText', mb: 1 }}>
                        {category === "Bowl" ? "1 Side + 1 Entree" :
                         category === "Plate" ? "1 Side + 2 Entrees" :
                         "1 Side + 3 Entrees"}
                      </Typography>
                      <Typography variant="h5" sx={{ color: 'primary.contrastText' }}>
                        ${menuItems.find(i => i.name === category)?.price.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                </Button>
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 4 }}>
              {/* Menu Items */}
              <Box sx={{ flex: 1 }}>
                {getFilteredAndGroupedItems()}
              </Box>

              {/* Cart */}
              <Card sx={{
                width: '24rem',
                height: 'fit-content',
                bgcolor: 'background.paper',
              }}>
				<CardContent>
                  <Typography variant="h6" sx={{ 
                    mb: 4,
                    fontWeight: 'bold',
                    color: 'text.primary',
                    ...textStyles.h6  // Add text scaling
                  }}>
                    Your Order
                  </Typography>

                  <Box sx={{ 
                    minHeight: '200px',
                    maxHeight: '60vh',
                    overflow: 'auto',
                    mb: 4,
                    ...(cart.length === 0 && {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      color: 'text.secondary',
                    })
                  }}>
                    {cart.length === 0 ? (
                      <>
                        <Typography variant="h6" sx={{ ...textStyles.h6, color: 'inherit' }}>
                          {emptyCartText}
                        </Typography>
                        <Typography variant="body2" sx={{ ...textStyles.body2, color: 'inherit' }}>
                          {selectItemsText}
                        </Typography>
                      </>
                    ) : (
                      cart.map((entry, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 1,
                            mb: 1,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                          }}
                        >
                          <IconButton 
                            onClick={() => setCart(cart.filter((_, i) => i !== index))}
                            color="error"
                            size="small"
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Box sx={{ flex: 1, ml: 1 }}>
                            <Typography variant="body1" sx={{ ...textStyles.body1 }}>
                              {entry.category}
                            </Typography>
                            <Typography variant="body2" sx={{ ...textStyles.body2, color: 'text.secondary' }}>
                              {entry.items.map(i => i.name).join(", ")}
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ ...textStyles.body1, color: 'black' }}>
                            ${entry.price.toFixed(2)}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>

                  <Box sx={{ 
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    pt: 2,
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ ...textStyles.body1 }}>Subtotal:</Typography>
                      <Typography sx={{ ...textStyles.body1 }}>${subtotal.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ ...textStyles.body1 }}>Tax:</Typography>
                      <Typography sx={{ ...textStyles.body1 }}>${tax.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      mb: 3,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      pt: 2
                    }}>
                      <Typography variant="h6" sx={{ ...textStyles.h6, fontWeight: 'bold' }}>Total:</Typography>
                      <Typography variant="h6" sx={{ ...textStyles.h6, fontWeight: 'bold' }}>
                        ${total.toFixed(2)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={handleCompletePurchase}
                        disabled={cart.length === 0 || showOrderComplete}
                        sx={{ 
                          py: 1.5,
                          fontSize: textStyles.buttonLarge.fontSize
                        }}
                        startIcon={<ShoppingCart />}
                      >
                        Complete Purchase
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        onClick={() => setCart([])}
                        disabled={cart.length === 0}
                        sx={{ 
                          py: 1.5,
                          fontSize: textStyles.buttonLarge.fontSize
                        }}
                        startIcon={<DeleteIcon />}
                      >
                        Clear Order
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Box>
      </Box>

      {/* Fixed Action Buttons (only show when not in categories view) */}
      {!showCategories && (
        <Paper 
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            zIndex: 1100,
            p: 2,
            height: '80px', // Explicitly set height
          }}
        >
          <Box sx={{ 
            display: 'flex',
            gap: 2,
            maxWidth: '90rem',
            mx: 'auto'
          }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={addItemToCart}
              startIcon={<AddIcon />}
              disabled={selectedItems.length === 0}
              sx={{ 
                py: 1.5,
                fontSize: textStyles.buttonLarge.fontSize,  // Add dynamic font size
              }}
            >
              Add to Order
            </Button>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => setSelectedItems([])}
              startIcon={<ClearIcon />}
              disabled={selectedItems.length === 0}
              sx={{ 
                py: 1.5,
                fontSize: textStyles.buttonLarge.fontSize,  // Add dynamic font size
              }}
            >
              Clear Selection
            </Button>
          </Box>
        </Paper>
      )}
        <Dialog 
          open={showRating} 
          onClose={(event, reason) => handleRatingClose(event, reason, true)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              overflow: 'hidden'
            }
          }}
        >
        <DialogTitle 
            sx={{
              ...textStyles.h5,
              background: 'rgb(192, 40, 39)',
              color: 'white',
              py: 3,
              textAlign: 'center',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
              fontWeight: 600
            }}
          >
            <Typography className="MuiTypography-root">
              How would you rate these items
            </Typography>
          </DialogTitle>
          
          <Box
            sx={{
              px: 4,
              py: 2,
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              bgcolor: '#fff9f9',
            }}
          >
            <Typography className="MuiTypography-root">
              Blank stars indicate no opinion
            </Typography>
          </Box>

        <DialogContent sx={{ p: 0 }}>
          <Stack 
            spacing={0} 
            sx={{ 
              maxHeight: '400px',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#d1d1d1',
                borderRadius: '4px',
                '&:hover': {
                  background: '#888',
                },
              },
            }}
          >
            {itemRatings.map((item, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 3,
                  px: 4,
                  py: 2.5,
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  },
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
                <Box
                  sx={{
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    bgcolor: 'rgb(192, 40, 39)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  {index + 1}
                </Box>
                <Typography 
                  className="MuiTypography-root"
                  sx={{ 
                    flex: 1, 
                    ...textStyles.body1,
                    fontWeight: 500,
                    color: '#333',
                  }}
                >
                  {item.itemName}
                </Typography>
                <UntranslatedRating
                  value={item.rating}
                  onChange={(_, newValue) => {
                    const newRatings = [...itemRatings];
                    newRatings[index].rating = newValue;
                    setItemRatings(newRatings);
                  }}
                />
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions 
          sx={{ 
            px: 4, 
            py: 3,
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            bgcolor: '#f8f8f8',
            gap: 2
          }}
        >
          <Button 
            onClick={handleSkipRatings}
            className="MuiButton-root"
            color="error" 
            variant="outlined"
            sx={{
              borderRadius: '8px',
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: textStyles.buttonLarge.fontSize,
            }}
          >
            Skip
          </Button>
          <Button 
            onClick={handleSubmitRatings}
            className="MuiButton-root"
            variant="contained"
            sx={{
              bgcolor: 'rgb(192, 40, 39)',
              borderRadius: '8px',
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: textStyles.buttonLarge.fontSize,
              '&:hover': {
                bgcolor: 'rgb(172, 36, 35)',
              }
            }}
          >
            Submit Ratings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KioskGUI;