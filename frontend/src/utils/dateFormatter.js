// src/utils/dateFormatter.js

/**
 * Formats a date string (like YYYY-MM-DD or ISO string) or Date object
 * into DD/MM/YYYY format.
 * Includes padding for single-digit day/month.
 *
 * @param {string | Date | null | undefined} dateInput The date to format.
 * @returns {string} The formatted date string or an empty string if input is invalid.
 */

export function formatDateToDDMMYYYY(dateInput) {
    if (!dateInput) return ''; // Handle null or undefined input

    try {
        const date = new Date(dateInput);

        // Check if the date is valid after parsing
        if (isNaN(date.getTime())) {
            console.warn("Invalid dateInput received:", dateInput);
            return '';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = date.getFullYear();

        // Ensure year is reasonable (e.g., not year 0 if input was only time)
        if (year < 1000) {
             console.warn("Year seems invalid after parsing:", dateInput, year);
             return ''; // Avoid displaying dates like 01/01/0000
        }


        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error("Error formatting date:", dateInput, error);
        return ''; // Return empty string on error
    }
}

// --- NEW FUNCTION for DD-Mon-YYYY format ---
const MONTH_ABBREVIATIONS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Formats a date string or Date object into DD-Mon-YYYY format (e.g., 17-Apr-2025).
 *
 * @param {string | Date | null | undefined} dateInput The date to format.
 * @returns {string} The formatted date string or an empty string if input is invalid.
 */
export function formatDateToDDMonYYYY(dateInput) {
    if (!dateInput) return '';

    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            console.warn("Invalid dateInput for DDMonYYYY:", dateInput);
            return '';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const monthIndex = date.getMonth(); // 0-11
        const monthAbbr = MONTH_ABBREVIATIONS[monthIndex];
        const year = date.getFullYear();

        if (year < 1000) {
            console.warn("Year seems invalid for DDMonYYYY:", dateInput, year);
            return '';
        }

        // Check if monthAbbr is valid (should always be if index is correct)
        if (!monthAbbr) {
             console.error("Invalid month index derived from date:", dateInput, monthIndex);
             return '';
        }


        return `${day}-${monthAbbr}-${year}`;
    } catch (error) {
        console.error("Error formatting date to DD-Mon-YYYY:", dateInput, error);
        return '';
    }
}


/**
 * Formats a date string or Date object into YYYY-MM-DD format
 * required by input type="date".
 *
 * @param {string | Date | null | undefined} dateInput The date to format.
 * @returns {string} The formatted date string or an empty string.
 */
export function formatDateToYYYYMMDD(dateInput) {
     if (!dateInput) return '';

     try {
         const date = new Date(dateInput);
         if (isNaN(date.getTime())) {
             console.warn("Invalid dateInput for YYYYMMDD:", dateInput);
            return '';
         }

        const day = String(date.getDate()).padStart(2, '0');
         const month = String(date.getMonth() + 1).padStart(2, '0');
         const year = date.getFullYear();

         if (year < 1000) {
            console.warn("Year seems invalid for YYYYMMDD:", dateInput, year);
            return '';
         }


        return `${year}-${month}-${day}`;
     } catch (error) {
         console.error("Error formatting date to YYYY-MM-DD:", dateInput, error);
        return '';
     }
}

// --- Recommendation: Using date-fns (Install first: npm install date-fns) ---
/*
import { format, parseISO, isValid } from 'date-fns';

export function formatDateToDDMMYYYYWithLib(dateInput) {
  if (!dateInput) return '';
  try {
    // Handles both Date objects and ISO-like strings
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return '';
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    console.error("Error formatting date with lib:", dateInput, error);
    return '';
  }
}

export function formatDateToYYYYMMDDWithLib(dateInput) {
   if (!dateInput) return '';
   try {
     const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
     if (!isValid(date)) return '';
     return format(date, 'yyyy-MM-dd');
   } catch (error) {
     console.error("Error formatting date to YYYY-MM-DD with lib:", dateInput, error);
     return '';
   }
}
*/