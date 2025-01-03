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

- **Minimum detection score:**  
  Set this to **0.5**.
  > This helps recognize more faces while avoiding false positives (non-faces).
- **Maximum recognition distance (Optional):**  
  Lower this value, e.g., to **0.4**, if the library contains people with similar facial features.
- **Minimum recognized faces:**  
  Set this to a **high value** (e.g., 10).
  > A high value ensures clusters only include faces that appear at least 10 times in the library, improving the initial clustering process.

---

#### 2. Run Reset Jobs

Go to:  
**Admin → Administration → Settings → Jobs**

Perform the following:

1. **FACE DETECTION → Reset**
2. **FACIAL RECOGNITION → Reset**

> These reset jobs rebuild the recognition model based on the new settings.

---

#### 3. Refine Recognition with Lower Thresholds

Once the reset jobs are complete, refine the recognition as follows:

- **Step 1:**  
  Return to **Minimum recognized faces** in Machine Learning Settings and lower the value to **8**.

  > Run the job: **FACIAL RECOGNITION → MISSING Mode**

- **Step 2:**  
  Lower the value again to **3**.
  > Run the job: **FACIAL RECOGNITION → MISSING Mode**

---

## Outcome

This method creates high-quality face clusters for core faces and ensures the model can reliably add new faces as they appear in your library.
