import polars as pl


def collapsed_table(language: str, df: pl.DataFrame) -> str:
    with pl.Config(
        tbl_formatting="ASCII_MARKDOWN",
        tbl_hide_column_data_types=True,
        tbl_hide_dataframe_shape=True,
        fmt_str_lengths=100,
        tbl_rows=1000,
        tbl_width_chars=1000,
    ):
        return f"<details><summary>{language}</summary>\n{str(df)}\n</details>"


languages = {
    "en": "English",
    "ar": "Arabic",
    "bn": "Bengali",
    "zh": "Chinese (Simplified)",
    "hr": "Croatian",
    "quz": "Cusco Quechua",
    "cs": "Czech",
    "da": "Danish",
    "nl": "Dutch",
    "fil": "Filipino",
    "fi": "Finnish",
    "fr": "French",
    "de": "German",
    "el": "Greek",
    "he": "Hebrew",
    "hi": "Hindi",
    "hu": "Hungarian",
    "id": "Indonesian",
    "it": "Italian",
    "ja": "Japanese",
    "ko": "Korean",
    "mi": "Maori",
    "no": "Norwegian",
    "fa": "Persian",
    "pl": "Polish",
    "pt": "Portuguese",
    "ro": "Romanian",
    "ru": "Russian",
    "es": "Spanish",
    "sw": "Swahili",
    "sv": "Swedish",
    "te": "Telugu",
    "th": "Thai",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "vi": "Vietnamese",
}

profile_df = pl.scan_ndjson("profiling/*.json").select("pretrained_model", "peak_rss", "exec_time_ms")
eval_df = pl.scan_ndjson("results/*.json").select("model", "pretrained", "language", "metrics")

eval_df = eval_df.with_columns(
    model=pl.col("model")
    .str.replace("xlm-roberta-base", "XLM-Roberta-Base")
    .str.replace("xlm-roberta-large", "XLM-Roberta-Large")
)
eval_df = eval_df.with_columns(pretrained_model=pl.concat_str(pl.col("model"), pl.col("pretrained"), separator="__"))
eval_df = eval_df.drop("model", "pretrained")
eval_df = eval_df.join(profile_df, on="pretrained_model")

eval_df = eval_df.with_columns(
    recall=(
        pl.col("metrics").struct.field("image_retrieval_recall@1")
        + pl.col("metrics").struct.field("image_retrieval_recall@5")
        + pl.col("metrics").struct.field("image_retrieval_recall@10")
    )
    * (100 / 3)
)

pareto_front = eval_df.join_where(
    eval_df.select("language", "peak_rss", "exec_time_ms", "recall").rename(
        {
            "language": "language_other",
            "peak_rss": "peak_rss_other",
            "exec_time_ms": "exec_time_ms_other",
            "recall": "recall_other",
        }
    ),
    (pl.col("language") == pl.col("language_other"))
    & (pl.col("peak_rss_other") <= pl.col("peak_rss"))
    & (pl.col("exec_time_ms_other") <= pl.col("exec_time_ms"))
    & (pl.col("recall_other") >= pl.col("recall"))
    & (
        (pl.col("peak_rss_other") < pl.col("peak_rss"))
        | (pl.col("exec_time_ms_other") < pl.col("exec_time_ms"))
        | (pl.col("recall_other") > pl.col("recall"))
    ),
)
eval_df = eval_df.join(pareto_front, on=["pretrained_model", "language"], how="left")
eval_df = eval_df.with_columns(is_pareto=pl.col("recall_other").is_null())
eval_df = (
    eval_df.drop("peak_rss_other", "exec_time_ms_other", "recall_other", "language_other")
    .unique(subset=["pretrained_model", "language"])
    .collect()
)
eval_df.write_parquet("model_info.parquet")

eval_df = eval_df.drop("metrics")
eval_df = eval_df.filter(pl.col("recall") >= 20)
eval_df = eval_df.sort("recall", descending=True)
eval_df = eval_df.select(
    pl.col("pretrained_model").alias("Model"),
    (pl.col("peak_rss") / 1024).round().cast(pl.UInt32).alias("Memory (MiB)"),
    pl.col("exec_time_ms").round(2).alias("Execution Time (ms)"),
    pl.col("language").alias("Language"),
    pl.col("recall").round(2).alias("Recall (%)"),
    pl.col("is_pareto").alias("Pareto Optimal"),
)


for language in languages:
    lang_df = eval_df.filter(pl.col("Language") == language).drop("Language")
    if lang_df.shape[0] == 0:
        continue
    print(collapsed_table(languages[language], lang_df))
