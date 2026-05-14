# %% [markdown]
#
# # Customer review sentiment with skore, skrub, and scikit-learn.
#
# ## Environment setup
#
# We need to install some extra dependencies for this notebook if needed (when
# running jupyterlite).

# %%
# %pip install skore skrub ipywidgets

# %% [markdown]
#
# ## Data
#
# This notebook uses a small **toy** corpus of English product reviews bundled in the
# script itself: half are clearly positive, half clearly negative. Each row
# has a **`review`** text and a binary label **`satisfied`** vs **`dissatisfied`**
# (stand-ins for positive vs negative sentiment). The dataset is tiny on purpose so it
# runs quickly in JupyterLite while still illustrating a text classification workflow.

# %%
import pandas as pd

positive_reviews = [
    "Absolutely loved this product, exceeded all my expectations",
    "Fast shipping and the item was exactly as described",
    "Great quality for the price, would definitely buy again",
    "Customer service was incredibly helpful and responsive",
    "Works perfectly, setup was easy and instructions were clear",
    "Solid build quality, feels premium and durable",
    "Arrived quickly and well packaged, very satisfied",
    "Exactly what I needed, performs as advertised",
    "Outstanding product, my whole family enjoys it",
    "Very impressed with the quality, highly recommend",
    "Brilliant purchase, works even better than expected",
    "Five stars, packaging was secure and delivery was fast",
    "Lovely product, great attention to detail",
    "Exceeded expectations, will order again without hesitation",
    "Perfect gift, recipient was absolutely delighted",
    "Runs quietly and efficiently, really happy with it",
    "Superb craftsmanship, clearly made to last",
    "Pleasantly surprised by the quality at this price point",
    "Easy to assemble, instructions were clear and helpful",
    "Fantastic value, does everything the listing promised",
]

negative_reviews = [
    "Stopped working after just two weeks, very disappointed",
    "Cheap plastic feel, nothing like what was shown in photos",
    "Arrived damaged and customer support was useless",
    "Complete waste of money, broke on first use",
    "Terrible product, does not match the description at all",
    "Sent the wrong item and getting a refund is impossible",
    "Fell apart within days, extremely poor build quality",
    "Would not recommend, packaging was torn and item scratched",
    "Instructions were missing and the product made loud noises",
    "Very disappointing, expected much better for this price",
    "Faulty unit straight out of the box, total waste",
    "Product looks nothing like the photos, very misleading",
    "Customer service ignored my complaint entirely",
    "Broke after a single use, absolutely terrible quality",
    "Flimsy and poorly constructed, regret buying this",
    "Never arrived and tracking showed no updates for weeks",
    "Very hard to assemble and pieces did not fit together",
    "Overpriced for what you get, deeply disappointed",
    "Stopped functioning after first charge, not acceptable",
    "Hugely disappointed, nothing like what was advertised",
]

X = pd.DataFrame({"review": positive_reviews + negative_reviews})
y = pd.Series(
    ["satisfied"] * len(positive_reviews) + ["dissatisfied"] * len(negative_reviews),
    dtype="category",
)

# %% [markdown]
#
# **skrub**'s `tabular_pipeline("classifier")` builds a default pipeline for tabular
# data, including free-text columns: **TableVectorizer** picks encoders suited to
# strings (for example high-cardinality text handling) before the classifier step.
#
# **`skore.evaluate`** with an integer **`splitter`** runs **cross-validation** and
# returns a report with aggregated **checks** and **metrics**. We set **`pos_label`**
# to **`satisfied`** so binary summaries align with the positive class.

# %%
import skore
import skrub
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression

estimator = make_pipeline(
    skrub.ApplyToCols(skrub.StringEncoder(random_state=42), cols="review"),
    LogisticRegression(),
)
report = skore.evaluate(
    estimator,
    X,
    y,
    splitter=5,
    pos_label="satisfied",
)
report

# %% [markdown]
#
# Summarize diagnostic **checks** (for example hints of over- or underfitting) across
# the cross-validated fits.

# %%
report.checks.summarize()

# %% [markdown]
#
# **Metrics** are aggregated across folds so you can read performance without writing a
# custom CV loop.

# %%
report.metrics.summarize().frame()

# %% [markdown]
#
# Let's use the fitted estimator to score new samples.
estimator.fit(X, y)
new_samples = pd.DataFrame(
    {
        "review": [
            "Really happy with this product, works great and arrived quickly",
            "It seems okay but nothing special, took a while to arrive",
            "Broke after one day and customer support never replied",
        ]
    }
)
new_samples["sentiment"] = estimator.predict(new_samples[["review"]])
new_samples
