def format_inr(amount: float, show_symbol: bool = True, include_decimals: bool = True) -> str:
    """
    Formats a numeric value according to the Indian numbering system:
    e.g. 1234567.89 -> ₹12,34,567.89
    """
    if amount is None:
        amount = 0.0

    is_negative = amount < 0
    amount = abs(amount)

    if include_decimals:
        formatted_dec = f"{amount:.2f}".split('.')[1]
    else:
        formatted_dec = None

    int_part = str(int(amount))

    if len(int_part) <= 3:
        result = int_part
    else:
        last3 = int_part[-3:]
        remaining = int_part[:-3]
        groups = []
        while len(remaining) > 2:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        if remaining:
            groups.insert(0, remaining)
        result = ",".join(groups) + "," + last3

    if include_decimals:
        result = f"{result}.{formatted_dec}"

    prefix = "₹" if show_symbol else ""
    sign = "-" if is_negative else ""
    return f"{sign}{prefix}{result}"

def format_inr_short(amount: float) -> str:
    """
    Formats large numbers into compact Indian representations (Lakhs, Crores, K).
    e.g. 150000 -> ₹1.5L, 25000000 -> ₹2.5Cr
    """
    if amount is None:
        return "₹0"
    
    val = float(amount)
    abs_val = abs(val)
    prefix = "-" if val < 0 else ""
    
    if abs_val >= 10000000:
        return f"{prefix}₹{abs_val / 10000000:.2f} Cr"
    elif abs_val >= 100000:
        return f"{prefix}₹{abs_val / 100000:.2f} L"
    elif abs_val >= 1000:
        return f"{prefix}₹{abs_val / 1000:.1f} K"
    else:
        return f"{prefix}₹{abs_val:.0f}"
