/**
 * Task Categories Definition
 */

export const CATEGORIES = [
  {
    id: 'Personal',
    name: 'Personal',
    icon: 'user',
    iconFamily: 'Feather',
    color: '#0D9488',
    bgLight: '#CCFBF1',
    bgDark: '#134E4A',
  },
  {
    id: 'Education',
    name: 'Education',
    icon: 'book-open',
    iconFamily: 'Feather',
    color: '#3B82F6',
    bgLight: '#DBEAFE',
    bgDark: '#1E3A8A',
  },
  {
    id: 'Work',
    name: 'Work',
    icon: 'briefcase',
    iconFamily: 'Feather',
    color: '#8B5CF6',
    bgLight: '#EDE9FE',
    bgDark: '#3B0764',
  },
  {
    id: 'Health & Fitness',
    name: 'Health & Fitness',
    icon: 'activity',
    iconFamily: 'Feather',
    color: '#10B981',
    bgLight: '#D1FAE5',
    bgDark: '#064E3B',
  },
  {
    id: 'Other',
    name: 'Other',
    icon: 'folder',
    iconFamily: 'Feather',
    color: '#64748B',
    bgLight: '#F1F5F9',
    bgDark: '#334155',
  },
];

export const getCategoryMeta = (categoryId) => {
  return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
};

