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


## 实际收益

current_usd = total_base_amt * current_base_price + (total_quote_amount + grid_profit) * current_quote_price

## 无网格收益
1. 先根据当前价格，计算理论的 total_base_amount, total_quote_amount, 计算方法如下：

ask 网格单，当前价格 > 网格价格，amount = 0, rev_amount(quote) = amount * order.price
ask 网格单， 当前价格 <= 网格价格, amount = grid_base_amt, rev_amount(quote) = 0

bid 网格单, 当前价格 >= 网格价格, amount(quote) = grid_base_amt * order.price, rev_amount(base) = 0
bid 网格单, 当前价格 < 网格价格, amount = 0, rev_amount = grid_base_amt

2. 计算当前理论usd

tvl_usd = total_base_amount * current_base_price + total_quote_amount * current_quote_price


## 根据上述公式

实际收益 APY = (current_usd / init_usd) ** (8760/运行小时) - 1
理论收益 APY = (tvl_usd / init_usd) ** (8760/运行小时) - 1


