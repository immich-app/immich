# Better Facial Recognition Clusters

## Purpose

This guide explains how to optimize facial recognition in systems with large image libraries. By following these steps, you'll achieve better clustering of faces, reducing the need for manual merging.

---

## Important Notes

- **Best Suited For:** Large image libraries after importing a significant number of images.
- **Warning:** This method deletes all previously assigned names.
- **Tip:** **Always take a [backup](/docs/administration/backup-and-restore#database) before proceeding!**

---

## Step-by-Step Instructions

### Objective

To enhance face clustering and ensure the model effectively identifies faces using qualitative initial data.

---

### Steps

#### 1. Adjust Machine Learning Settings

Navigate to:  
**Admin → Administration → Settings → Machine Learning Settings**

Make the following changes:

- **Maximum recognition distance (Optional):**  
  Lower this value, e.g., to **0.4**, if the library contains people with similar facial features.
- **Minimum recognized faces:**  
  Set this to a **high value** (e.g., 20 For libraries with a large amount of assets (~100K+), and 10 for libraries with medium amount of assets (~40K+)).
  > A high value ensures clusters only include faces that appear at least 20/`value` times in the library, improving the initial clustering process.

---

#### 2. Run Reset Jobs

Go to:  
**Admin → Administration → Settings → Jobs**

Perform the following:

1. **FACIAL RECOGNITION → Reset**

> These reset jobs rebuild the recognition model based on the new settings.

---

#### 3. Refine Recognition with Lower Thresholds

Once the reset jobs are complete, refine the recognition as follows:

- **Step 1:**  
  Return to **Minimum recognized faces** in Machine Learning Settings and lower the value to **10** (In medium libraries we will lower the value from 10 to 5).

  > Run the job: **FACIAL RECOGNITION → MISSING Mode**

- **Step 2:**  
  Lower the value again to **3**.
  > Run the job: **FACIAL RECOGNITION → MISSING Mode**

:::tip try different values
For certain libraries with a larger or smaller amount of assets, other settings will be better or worse. It is recommended to try different values **​​before assigning names** and see which settings work best for your library.
:::

---
