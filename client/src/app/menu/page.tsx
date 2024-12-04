// "use client";
// import React, { useState, useEffect } from 'react';
// import { Typography, Grid, Card, CardContent, Box, CardMedia } from '@mui/material';
// import axios from 'axios';
// import { getImagePath } from '@/pages/api/cloudinary';

// // interface MenuItemResponse {
// //   menu_item_id: number;
// //   name: string;
// //   price: number;
// //   amount_available: number;
// //   type: string;
// //   is_favorite: boolean;
// // }

// interface MenuItemProps {
//   item: MenuItem;
// }

// // interface MenuItem extends MenuItemResponse {
// //   category?: string;
// //   image?: string;
// //   calories?: string;
// //   prices?: { size: string; price: string; }[];
// // }

// // interface DrinkItem extends MenuItemResponse {
// //   size?: string;
// // }

// export interface MenuItemResponse {
//   menu_item_id: number;
//   name: string;
//   price: number;
//   amount_available: number;
//   type: string;
//   is_favorite: boolean;
//   image_url?: string;
// }

// export interface MenuItem extends MenuItemResponse {
//   category?: string;
//   image?: string;
//   calories?: string;
//   prices?: { size: string; price: string; }[];
//   isFavorite?: boolean;
// }

// export interface DrinkItem extends MenuItemResponse {
//   size?: string;
// }

// const Menu_Board = () => {
//   const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const CLOUDINARY_URL = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto/`;


//   const mealOptions = [
//     {
//       title: 'BOWL',
//       description: '1 entrée & 1 side',
//       price: '$6.00',
//       calories: '190-990 cal',
//       icon: 'images/bowl-icon.png' // Add your image path here
//     },
//     {
//       title: 'PLATE',
//       description: '2 entrées & 1 side',
//       price: '$7.00',
//       calories: '240-1440 cal',
//       icon: 'images/plate-icon.png' // Add your image path here
//     },
//     {
//       title: 'BIGGER PLATE',
//       description: '3 entrées & 1 side',
//       price: '$8.50',
//       calories: '320-1930 cal',
//       icon: 'images/bigger-plate-icon.png' // Add your image path here
//     },
//     {
//       title: 'A LA CARTE',
//       description: '1 side',
//       price: '$4.10',
//       calories: '250-1000 cal',
//       icon: 'images/a-la-carte-icon.png' // Add your image path here
//     },
//     {
//       title: 'EXTRAS',
//       description: 'Drinks and appetizers',
//       price: 'Price Varies',
//       calories: '',
//       icon: 'images/extras-icon.png' // Add your image path here
//     }
//   ];
  
//   interface WeatherApiResponse {
//     current: {
//       temperature: number;
//       weather_descriptions: string[];
//       weather_icons: string[];
//     };
//   }
  
//   interface WeatherState {
//     temperature: string;
//     condition: string;
//     icon: string | null;
//   }

//   const [weather, setWeather] = useState<WeatherState>({
//     temperature: '--',
//     condition: 'Loading...',
//     icon: null,
//   });

//   const mapDatabaseCategoryToFrontend = (dbCategory: string): string => {
//     // Convert to lowercase for consistent comparison
//     const category = dbCategory.toLowerCase();
    
//     // Map multiple backend categories to "Extra"
//     if (category === 'appetizer' || category === 'dessert' || category === 'drink') {
//       return 'Extra';
//     }
//     // Handle other category mappings
//     else if (category === 'entree' || category === 'premium entree') {
//       return 'Entree';
//     }
//     else if (category === 'side') {
//       return 'Side';
//     }
//     return category; // fallback
//   };
  
//   // Update the fetchMenuItems function to use this mapping
//   useEffect(() => {
//         const fetchMenuItems = async () => {
//           try {
//             const response = await axios.get<MenuItemResponse[]>('/api/menu2');
            
//             // Handle drinks separately
//             const drinks = response.data.filter(item => item.type.toLowerCase() === 'drink');
            
//             const drinkItem: MenuItem | null = drinks.length > 0 ? {
//               menu_item_id: drinks[0].menu_item_id,
//               name: 'Drink',
//               type: 'drink',
//               category: 'Extra',
//               image: getImagePath(drinks[0]),
//               amount_available: drinks[0].amount_available,
//               price: drinks[0].price,
//               is_favorite: drinks[0].is_favorite,  // Add this to match the interface
//               prices: drinks.map(drink => ({
//                 size: drink.name.split(' ')[0],
//                 price: drink.price.toFixed(2)
//               })).sort((a, b) => {
//                 const sizeOrder: Record<string, number> = {
//                   'Small': 1,
//                   'Medium': 2,
//                   'Large': 3
//                 };
//                 return sizeOrder[a.size] - sizeOrder[b.size];
//               }),
//               isFavorite: drinks[0].is_favorite  // You can keep this for backwards compatibility
//             } : null;
      
//             // Format all non-drink items
//             const otherItems = response.data
//               .filter(item => item.type.toLowerCase() !== 'drink')
//               .map(item => ({
//                 ...item,
//                 category: item.type.toLowerCase() === 'premium entree' ? 'Entree' : 
//                         ['appetizer', 'dessert'].includes(item.type.toLowerCase()) ? 'Extra' : 
//                         item.type === 'side' ? 'Side' : 'Entree',
//                 image: getImagePath(item),
//                 price: parseFloat(item.price.toFixed(2)),
//                 calories: '200 cal',
//                 isFavorite: item.is_favorite  // Add this for consistency
//               }));
      
//             const formattedMenuItems = drinkItem
//               ? [...otherItems, drinkItem]
//               : otherItems;
      
//             setMenuItems(formattedMenuItems);
//             setLoading(false);
//           } catch (err) {
//             console.error('Error fetching menu items:', err);
//             setError('Failed to fetch menu items');
//             setLoading(false);
//           }
//         };
      
//         fetchMenuItems();
//       }, []);

//   useEffect(() => {
//     const fetchWeather = async () => {
//       const API_KEY = 'a188c2d367b8b334972ff07341be2b1e'; // Your actual API key
//       const BASE_URL = 'http://api.weatherstack.com/current';
//       const city = 'College Station, TX';

//       try {
//         // Step 3: Specify the type of the API response in the axios.get call
//         const response = await axios.get<WeatherApiResponse>(BASE_URL, {
//           params: {
//             access_key: API_KEY,
//             query: city,
//             units: 'f',
//           },
//         });

//         if (response.data && response.data.current) {
//           setWeather({
//             temperature: response.data.current.temperature.toString(),
//             condition: response.data.current.weather_descriptions[0],
//             icon: response.data.current.weather_icons[0],
//           });
//         } else {
//           console.error('Unexpected API response:', response.data);
//           setWeather({ temperature: '--', condition: 'Error', icon: null });
//         }
//       } catch (error) {
//         console.error('Error fetching weather data:', error);
//         setWeather({ temperature: '--', condition: 'Error', icon: null });
//       }
//     };

//     fetchWeather();
//   }, []);

  

//   const SimpleWeatherBox = () => {
//     return (
//       <Card
//         sx={{
//           mb: 2,
//           bgcolor: '#fff',
//           boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
//         }}
//       >
//         <Box
//           sx={{
//             p: 2,
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//           }}
//         >
//           <Typography sx={{ fontWeight: 600 }}>Panda Express</Typography>
//           <Box
//             sx={{
//               display: 'flex',
//               gap: 4,
//               alignItems: 'center',
//             }}
//           >
//             {/* Weather Icon */}
//             {weather.icon && (
//               <img
//                 src={weather.icon}
//                 alt="Weather Icon"
//                 style={{ width: 40, height: 40 }}
//               />
//             )}
//             {/* Temperature and Condition */}
//             <Box>
//               <Typography
//                 sx={{
//                   fontSize: '1rem',
//                   fontWeight: 600,
//                 }}
//               >
//                 {weather.temperature}°F
//               </Typography>
//               <Typography sx={{ color: '#666' }}>{weather.condition}</Typography>
//             </Box>
//           </Box>
//         </Box>
//       </Card>
//     );
//   };

//   // Group items by category
//   // type MenuItem = {
//   //   menu_item_id: number;
//   //   name: string;
//   //   price: number; // Changed from string since your DB uses double precision
//   //   amount_available: number;
//   //   type: string;
//   //   // Frontend display properties
//   //   image?: string;
//   //   category?: string;
//   //   calories?: string;
//   //   isFavorite?: boolean;
//   //   prices?: { size: string; price: string; }[];
//   // };

//   const groupedItems = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
//     const category = item.category || item.type; // Fallback to type if category is not set
//     if (!acc[category]) {
//       acc[category] = [];
//     }
//     acc[category].push(item);
//     return acc;
//   }, {});

//   const categoryConfig = [
//     { key: 'Entree', display: 'ENTRÉES' },
//     { key: 'Side', display: 'SIDES' },
//     { key: 'Extra', display: 'EXTRAS' }
//   ];

//   type MenuItemProps = {
//     item: MenuItem; // Specify that the 'item' prop should be of type 'MenuItem'
//   };

//   const MenuItemCard: React.FC<MenuItemProps> = ({ item }) => {
//     const [imageError, setImageError] = useState(false);

//     useEffect(() => {
//       console.log(`Loading image for ${item.name}:`, item.image);
//     }, [item]);
  
//     const handleImageError = () => {
//       console.log('Image failed to load:', item.image);
//       setImageError(true);
//     };
  
//     // Get the correct image path
//     const getItemImage = () => {
//       if (imageError) {
//         return '/images/placeholder.png';
//       }
      
//       // For test items, use their type as prefix
//       if (item.name.toLowerCase().includes('test')) {
//         const type = item.type.toLowerCase();
//         const formattedTestName = `${type}test_item_with_no_space`;
//         console.log('Test item path:', formattedTestName); // Debug log
//         return `${CLOUDINARY_URL}${formattedTestName}`;
//       }
      
//       // If there's a direct image_url, use it
//       if (item.image_url) {
//         return item.image_url;
//       }
      
//       // For manually uploaded items in the panda express images folder
//       const type = item.type.toLowerCase();
//       const formattedName = item.name.replace(/\s+/g, '_');
//       return `${CLOUDINARY_URL}panda express images/${type}${formattedName}`;
//     };

//     return (
//       <Grid item>
//       <Card
//         sx={{
//           display: 'flex',
//           alignItems: 'center',
//           bgcolor: '#fff',
//           boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
//           height: '110px',
//           width: '100%',
//           position: 'relative',
//         }}
//       >
//         {item.isFavorite && (
//           <Box
//             sx={{
//               position: 'absolute',
//               top: 8,
//               right: 8,
//               bgcolor: '#8b5e34',
//               color: 'white',
//               px: 1,
//               py: 0.5,
//               borderRadius: 1,
//               fontSize: '0.7rem',
//               fontWeight: 600,
//             }}
//           >
//             Customer Favorite
//           </Box>
//         )}

// <Box
//           sx={{
//             width: '120px',
//             height: '120px',
//             display: 'flex',
//             justifyContent: 'center',
//             alignItems: 'center',
//             p: 1,
//             bgcolor: '#fff',
//           }}
//         >
//           <CardMedia
//             component="img"
//             image={getItemImage()}
//             alt={item.name}
//             sx={{
//               maxHeight: '100px',
//               maxWidth: '100px',
//               objectFit: 'contain',
//             }}
//             onError={handleImageError}
//           />
//         </Box>
  
//           <CardContent
//             sx={{
//               flex: 1,
//               p: 1,
//               '&:last-child': { pb: 1 },
//               display: 'flex',
//               flexDirection: 'column',
//               justifyContent: 'center',
//             }}
//           >
//             <Typography
//               sx={{
//                 fontSize: '0.85rem',
//                 fontWeight: 600,
//                 color: '#2c2c2c',
//                 mb: 0.25,
//               }}
//             >
//               {item.name}
//             </Typography>
//             {item.prices ? (
//               <Box
//                 sx={{
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   alignItems: 'center',
//                   flexWrap: 'wrap',
//                 }}
//               >
//                 {item.prices.map((sizePrice, index) => (
//                   <Typography
//                     key={index}
//                     sx={{
//                       fontSize: '0.75rem',
//                       color: '#666',
//                       mx: 0.5,
//                     }}
//                   >
//                     {sizePrice.size}: ${sizePrice.price}
//                   </Typography>
//                 ))}
//               </Box>
//             ) : (
//               <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
//                 ${item.price}
//               </Typography>
//             )}
//           </CardContent>
//         </Card>
//       </Grid>
//     );
//   };
  


//   return (
//     <Box 
//       sx={{ 
//         width: '100vw',
//         height: '100vh',
//         bgcolor: '#faf6f1',
//         overflow: 'hidden',
//         p: 2
//       }}
//     >
//       {/* Weather Box */}
//       <SimpleWeatherBox />
      
//       {/* Meal Options Bar */}
      
//       <Card
//   sx={{
//     mb: 2,
//     bgcolor: '#fff',
//     boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
//   }}
// >
//   <Grid container sx={{ p: 1.5 }}>
//     {mealOptions.map((option, index) => (
//       <Grid item xs={2.4} key={index}>
//         <Box
//           sx={{
//             display: 'flex',
//             alignItems: 'center',
//             mb: 1,
//           }}
//         >
//           {/* Display only the icon */}
//           <img
//             src={option.icon}
//             alt={option.title}
//             style={{
//               width: '40px',
//               height: '40px',
//               marginRight: '8px', // Add some spacing between icon and text
//             }}
//           />

//           {/* Text content */}
//           <Box>
//             <Typography
//               sx={{
//                 fontWeight: 600,
//                 fontSize: '0.8rem',
//                 color: '#2c2c2c',
//                 mb: 0.25,
//               }}
//             >
//               {option.title}
//             </Typography>
//             <Typography
//               sx={{
//                 fontSize: '0.7rem',
//                 color: '#666',
//                 mb: 0.25,
//               }}
//             >
//               {option.description} - {option.price}
//             </Typography>
//             <Typography
//               sx={{
//                 fontSize: '0.65rem',
//                 color: '#666',
//               }}
//             >
//               {option.calories}
//             </Typography>
//           </Box>
//         </Box>
//       </Grid>
//     ))}
//   </Grid>
// </Card>


//       {/* Menu Categories */}
//       <Box sx={{ 
//         display: 'flex', 
//         gap: 2,
//         height: 'calc(100vh - 140px)'
//       }}>
//         {categoryConfig.map(({ key, display }) => groupedItems[key] && (
//           <Box
//           key={key}
//           sx={{
//             flex: key === 'Side' || key === 'Extra' ? 0.8 : 1, // Reduce the size for 'Side' and 'Extra'
//             display: 'flex',
//             flexDirection: 'column',
//           }}
//         >
//           <Typography
//             variant="h6"
//             sx={{
//               fontWeight: 600,
//               mb: 1,
//               pb: 0.5,
//               borderBottom: '2px solid #8b5e34',
//               color: '#2c2c2c',
//               fontSize: '1rem',
//             }}
//           >
//             {display}
//           </Typography>
//           <Grid
//             container
//             direction="column"
//             spacing={1}
//             sx={{
//               flex: 1,
//               overflowY: 'hidden',
//             }}
//           >
//             {groupedItems[key].map((item, index) => (
//               <MenuItemCard key={index} item={item} />
//             ))}
//           </Grid>
//         </Box>
//         ))}
//       </Box>
//     </Box>
//   );
// };

// export default Menu_Board;