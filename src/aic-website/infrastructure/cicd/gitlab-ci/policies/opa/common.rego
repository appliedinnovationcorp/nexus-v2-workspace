package gitlab.common

# Helper function to check if a string contains a substring
contains(str, substr) {
    indexof(str, substr) != -1
}

# Helper function to check if a string starts with a prefix
startswith(str, prefix) {
    substr(str, 0, count(prefix)) == prefix
}

# Helper function to check if a string ends with a suffix
endswith(str, suffix) {
    substr(str, count(str) - count(suffix), count(str)) == suffix
}

# Helper function to trim a suffix from a string
trim_suffix(str, suffix) {
    endswith(str, suffix)
    result := substr(str, 0, count(str) - count(suffix))
    result
}

# If string doesn't end with suffix, return original string
trim_suffix(str, suffix) {
    not endswith(str, suffix)
    str
}

# Helper function to convert string to number
to_number(str) {
    result := cast_number(str)
    result
}

# Helper function for safe number conversion
to_number(str) = 0 {
    not cast_number(str)
}

# Helper function to check if a value is in an array
in_array(arr, val) {
    arr[_] = val
}

# Helper function to check if all elements of arr1 are in arr2
all_in_array(arr1, arr2) {
    count({x | x = arr1[_]; not in_array(arr2, x)}) == 0
}

# Helper function to get the intersection of two arrays
intersection(arr1, arr2) = result {
    result := {x | x = arr1[_]; in_array(arr2, x)}
}

# Helper function to get the difference of two arrays
difference(arr1, arr2) = result {
    result := {x | x = arr1[_]; not in_array(arr2, x)}
}

# Helper function to check if a key exists in an object
has_key(obj, key) {
    obj[key]
}

# Helper function to safely get a value from an object
get_value(obj, key, default) = result {
    has_key(obj, key)
    result := obj[key]
}

get_value(obj, key, default) = default {
    not has_key(obj, key)
}

# Helper function to check if a string matches a regex pattern
matches(str, pattern) {
    re_match(pattern, str)
}

# Helper function to split a string
split(str, delimiter) = result {
    result := split(str, delimiter)
}

# Helper function to join an array of strings
join(arr, delimiter) = result {
    result := concat(delimiter, arr)
}

# Helper function to check if a value is null or undefined
is_null_or_undefined(val) {
    val == null
}

is_null_or_undefined(val) {
    not val
}

# Helper function to check if a value is a number
is_number(val) {
    to_number(val) == val
}

# Helper function to check if a value is a string
is_string(val) {
    typeof(val) == "string"
}

# Helper function to check if a value is an array
is_array(val) {
    count(val) >= 0
}

# Helper function to check if a value is an object
is_object(val) {
    keys := {k | val[k] = _}
    count(keys) >= 0
}

# Helper function to check if a value is a boolean
is_boolean(val) {
    val == true
}

is_boolean(val) {
    val == false
}
