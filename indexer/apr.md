# Grid Trading 收益计算

## 基础变量

- `init_base_amount` / `init_quote_amount`: 初始 base/quote 数量
- `init_base_price` / `init_quote_price`: 初始 base/quote 的 USD 价格
- `current_base_amount` / `current_quote_amount`: 当前 base/quote 数量
- `current_base_price` / `current_quote_price`: 当前 base/quote 的 USD 价格
- `grid_profit`: 网格已实现利润（以 quote token 计量）
- `init_time` / `current_time`: 开仓时间 / 当前时间（unix timestamp）

## 初始投入 (USD)

```
init_usd = init_base_amount * init_base_price + init_quote_amount * init_quote_price
```

## 1. HODL 收益率

如果不做网格，只是持有初始仓位不动的收益率：

```
hodl_usd = init_base_amount * current_base_price + init_quote_amount * current_quote_price
hodl_profit_rate = hodl_usd / init_usd - 1
```

## 2. Grid 收益率 (exclude IL)

用初始价格来估值当前持仓 + 网格利润，排除价格波动的影响，纯看网格策略赚了多少：

```
grid_value_exclude_il = current_base_amount * init_base_price + current_quote_amount * init_quote_price + grid_profit * init_quote_price
grid_profit_rate_exclude_il = grid_value_exclude_il / init_usd - 1
```

## 3. Grid 收益率 (real)

用当前价格估值当前持仓 + 网格利润，反映真实的总收益：

```
grid_value_real = current_base_amount * current_base_price + current_quote_amount * current_quote_price + grid_profit * current_quote_price
grid_profit_rate_real = grid_value_real / init_usd - 1
```

## 4. 年化收益率

```
elapsed_days = (current_time - init_time) / 86400
```

### 非 compound 模式 — 简单年化 (APR)

利润不会自动复投，收益线性增长：

```
apr_exclude_il = grid_profit_rate_exclude_il / elapsed_days * 365
apr_real = grid_profit_rate_real / elapsed_days * 365
```

### compound 模式 — 复利年化 (APY)

利润自动复投到网格中，收益按复利增长：

```
apy_exclude_il = (1 + grid_profit_rate_exclude_il) ^ (365 / elapsed_days) - 1
apy_real = (1 + grid_profit_rate_real) ^ (365 / elapsed_days) - 1
```
