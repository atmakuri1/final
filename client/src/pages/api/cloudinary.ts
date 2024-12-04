interface MenuItem {
  menu_item_id: number;
  name: string;
  type: string;
  image_url?: string;
}

export const getImagePath = (item: MenuItem): string => {
  if (item.image_url) {
    return item.image_url;
  }
  
  // Format the name to create the image path
  const formattedName = item.name.toLowerCase().replace(/\s+/g, '_');
  const type = item.type.toLowerCase();
  
  return `/images/${type}${formattedName}.png`;
};